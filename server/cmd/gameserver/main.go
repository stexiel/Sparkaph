package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"github.com/stexiel/sparkaph/pkg/config"
	"github.com/stexiel/sparkaph/pkg/matchmaker"
	"github.com/stexiel/sparkaph/pkg/protocol"
	"github.com/vmihailenco/msgpack/v5"
	"go.uber.org/zap"
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // Allow all origins (configure properly in production)
		},
	}
)

type Server struct {
	config      *config.Config
	matchmaker  *matchmaker.Matchmaker
	logger      *zap.Logger
	connections map[string]*PlayerConnection
}

type PlayerConnection struct {
	PlayerID string
	Conn     *websocket.Conn
	SendChan chan []byte
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Load configuration
	cfg := config.Load()

	// Create server
	server := &Server{
		config:      cfg,
		matchmaker:  matchmaker.NewMatchmaker(logger),
		logger:      logger,
		connections: make(map[string]*PlayerConnection),
	}

	// Setup HTTP routes
	http.HandleFunc("/ws", server.handleWebSocket)
	http.HandleFunc("/health", server.handleHealth)
	http.HandleFunc("/metrics", server.handleMetrics)

	// Start HTTP server
	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	httpServer := &http.Server{
		Addr:         addr,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	// Graceful shutdown
	go func() {
		logger.Info("Server starting", zap.String("addr", addr))
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Server shutting down...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	server.matchmaker.Stop()
	logger.Info("Server stopped")
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.logger.Error("WebSocket upgrade failed", zap.Error(err))
		return
	}

	s.logger.Info("New WebSocket connection", zap.String("remote", r.RemoteAddr))

	// Handle connection
	go s.handleConnection(conn)
}

func (s *Server) handleConnection(conn *websocket.Conn) {
	defer conn.Close()

	playerConn := &PlayerConnection{
		Conn:     conn,
		SendChan: make(chan []byte, 256),
	}

	// Start write pump
	go s.writePump(playerConn)

	// Read messages
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				s.logger.Error("WebSocket error", zap.Error(err))
			}
			break
		}

		s.handleMessage(playerConn, data)
	}

	// Cleanup
	if playerConn.PlayerID != "" {
		s.matchmaker.RemoveFromQueue(playerConn.PlayerID)
		delete(s.connections, playerConn.PlayerID)
	}
}

func (s *Server) handleMessage(playerConn *PlayerConnection, data []byte) {
	var msg protocol.Message
	if err := msgpack.Unmarshal(data, &msg); err != nil {
		s.logger.Error("Failed to unmarshal message", zap.Error(err))
		return
	}

	switch msg.Type {
	case protocol.MsgTypeConnect:
		s.handleConnect(playerConn, msg.Data)
	case protocol.MsgTypeInput:
		s.handleInput(playerConn, msg.Data)
	case protocol.MsgTypePing:
		s.handlePing(playerConn, msg.Data)
	default:
		s.logger.Warn("Unknown message type", zap.Uint8("type", msg.Type))
	}
}

func (s *Server) handleConnect(playerConn *PlayerConnection, data []byte) {
	var connectMsg protocol.ConnectMessage
	if err := msgpack.Unmarshal(data, &connectMsg); err != nil {
		s.logger.Error("Failed to unmarshal connect message", zap.Error(err))
		return
	}

	playerConn.PlayerID = connectMsg.PlayerID
	s.connections[connectMsg.PlayerID] = playerConn

	// Send welcome message
	welcome := protocol.WelcomeMessage{
		PlayerID:     connectMsg.PlayerID,
		SessionToken: "session_" + connectMsg.PlayerID,
		ServerTime:   time.Now().UnixMilli(),
		TickRate:     s.config.Game.TickRate,
	}

	s.sendMessage(playerConn, protocol.MsgTypeWelcome, &welcome)

	// Add to matchmaking queue
	queuedPlayer := &matchmaker.QueuedPlayer{
		ID:       connectMsg.PlayerID,
		Username: connectMsg.Username,
		Rating:   1000,
	}

	mode := matchmaker.GameMode(connectMsg.GameMode)
	if err := s.matchmaker.AddToQueue(mode, queuedPlayer); err != nil {
		s.logger.Error("Failed to add player to queue", zap.Error(err))
	}

	s.logger.Info("Player connected",
		zap.String("playerID", connectMsg.PlayerID),
		zap.String("username", connectMsg.Username),
		zap.String("mode", connectMsg.GameMode),
	)
}

func (s *Server) handleInput(playerConn *PlayerConnection, data []byte) {
	var inputMsg protocol.InputMessage
	if err := msgpack.Unmarshal(data, &inputMsg); err != nil {
		s.logger.Error("Failed to unmarshal input message", zap.Error(err))
		return
	}

	// TODO: Forward input to active match
}

func (s *Server) handlePing(playerConn *PlayerConnection, data []byte) {
	var pingMsg protocol.PingMessage
	if err := msgpack.Unmarshal(data, &pingMsg); err != nil {
		return
	}

	pong := protocol.PongMessage{
		ClientTime: pingMsg.ClientTime,
		ServerTime: time.Now().UnixMilli(),
	}

	s.sendMessage(playerConn, protocol.MsgTypePong, &pong)
}

func (s *Server) sendMessage(playerConn *PlayerConnection, msgType uint8, data interface{}) {
	msgData, err := msgpack.Marshal(data)
	if err != nil {
		s.logger.Error("Failed to marshal message", zap.Error(err))
		return
	}

	msg := protocol.NewMessage(msgType, msgData)
	encoded, err := msgpack.Marshal(msg)
	if err != nil {
		s.logger.Error("Failed to marshal envelope", zap.Error(err))
		return
	}

	select {
	case playerConn.SendChan <- encoded:
	default:
		s.logger.Warn("Send channel full, dropping message")
	}
}

func (s *Server) writePump(playerConn *PlayerConnection) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case message, ok := <-playerConn.SendChan:
			if !ok {
				playerConn.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := playerConn.Conn.WriteMessage(websocket.BinaryMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			if err := playerConn.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, "OK")
}

func (s *Server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	metrics := map[string]interface{}{
		"active_connections": len(s.connections),
		"active_matches":     s.matchmaker.GetActiveMatchCount(),
		"queue_solo":         s.matchmaker.GetQueueSize(matchmaker.ModeSolo),
		"queue_duo":          s.matchmaker.GetQueueSize(matchmaker.ModeDuo),
		"queue_squad":        s.matchmaker.GetQueueSize(matchmaker.ModeSquad),
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, "%v", metrics)
}
