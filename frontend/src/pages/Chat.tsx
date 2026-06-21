import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  Send,
  User,
  Search,
  Plus,
  Smile,
  Sticker,
  Phone,
  Video,
  Check,
  CheckCheck,
  Paperclip,
  Ban,
  Bell,
  Code,
  Globe,
  ChevronLeft,
  ChevronRight,
  Archive,
  Link,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import VoiceRecorder from "../components/VoiceRecorder";
import CustomEmojiPicker from "../components/EmojiPicker";
import StickerPicker from "../components/StickerPicker";
import AudioPlayer from "../components/AudioPlayer";
import CallModal from "../components/CallModal";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import Peer from "simple-peer";
import type { EmojiClickData } from "emoji-picker-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import CustomAlert from "../components/CustomAlert";
import { useAlert } from "../hooks/useAlert";

import { API_URL, APPS_URL, WS_URL } from '../config';
interface Message {
  id: string;
  content: string;
  type: string;
  fileUrl?: string;
  senderId: string;
  chatId: string;
  createdAt: string;
  sender: { username: string; avatar: string | null };
  statuses: { userId: string; status: string }[];
}

interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  chatMembers: {
    user: {
      id: string;
      username: string;
      avatar: string | null;
      isOnline: boolean;
      lastSeen: string | null;
    };
  }[];
  messages: Message[];
  unreadCount: number;
  app?: {
    id: string;
    name: string;
    handle: string;
    description: string;
    icon: string | null;
    type: string;
    status: string;
    user?: {
      username: string;
      avatar: string | null;
    };
  };
}

const Chat: React.FC = () => {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const { alerts, showAlert, removeAlert } = useAlert();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatListCollapsed, setIsChatListCollapsed] = useState(false);
const [showChatList, setShowChatList] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [archivedChats, setArchivedChats] = useState<Chat[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Call State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState<any>();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [showCallModal, setShowCallModal] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);

  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<Peer.Instance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      const newSocket = io(WS_URL, {
        transports: ["websocket"],
        reconnection: true,
      });
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to socket");
        newSocket.emit("setup", parsedUser.id);
      });

      fetchChats(token);

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (socket && activeChat) {
      socket.emit("join_chat", activeChat.id);
      fetchMessages(activeChat.id);

      socket.on("new_message", (message: Message) => {
        if (activeChat && message.chatId === activeChat.id) {
          setMessages((prev) => [...prev, message]);
          scrollToBottom();
          // Mark as read immediately if chat is active
          markMessagesAsRead(activeChat.id);
        } else {
          // Show notification
          if (Notification.permission === "granted") {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser.notificationsEnabled !== false) {
                new Notification(
                  `${t("new_message_from")} ${message.sender.username}`,
                  {
                    body:
                      message.content ||
                      (message.type === "VOICE"
                        ? t("voice_message")
                        : t("sticker")),
                    icon: "/logo.png",
                  },
                );

                // Play notification sound
                const audio = new Audio("/blink.mp3");
                audio.volume = 0.5;
                audio.load();
                audio
                  .play()
                  .catch((e) => console.error("Audio play failed", e));
              }
            }
          }
        }
        // Update chat list to show latest message or move chat to top
        fetchChats(localStorage.getItem("token") || "");
      });

      socket.on("messages_read", ({ chatId, userId }) => {
        if (activeChat && activeChat.id === chatId) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.senderId === user.id) {
                // Update status locally
                const existingStatus = msg.statuses.find(
                  (s) => s.userId === userId,
                );
                if (existingStatus) {
                  return {
                    ...msg,
                    statuses: msg.statuses.map((s) =>
                      s.userId === userId ? { ...s, status: "READ" } : s,
                    ),
                  };
                } else {
                  return {
                    ...msg,
                    statuses: [...msg.statuses, { userId, status: "READ" }],
                  };
                }
              }
              return msg;
            }),
          );
        }
      });

      socket.on("user_online", (userId: string) => {
        setChats((prev) =>
          prev.map((chat) => ({
            ...chat,
            chatMembers: chat.chatMembers.map((member) =>
              member.user.id === userId
                ? { ...member, user: { ...member.user, isOnline: true } }
                : member,
            ),
          })),
        );
      });

      socket.on("user_offline", (userId: string) => {
        setChats((prev) =>
          prev.map((chat) => ({
            ...chat,
            chatMembers: chat.chatMembers.map((member) =>
              member.user.id === userId
                ? {
                    ...member,
                    user: {
                      ...member.user,
                      isOnline: false,
                      lastSeen: new Date().toISOString(),
                    },
                  }
                : member,
            ),
          })),
        );
      });

      socket.on("call_user", (data) => {
        setReceivingCall(true);
        setCaller(data.from); // This should be the socket ID or user ID depending on backend logic
        setName(data.name);
        setCallerSignal(data.signal);
        setShowCallModal(true);
        // Determine if video call based on some data or default
        // For now, assume video if not specified, or pass it in signal
      });

      socket.on("call_ended", () => {
        setCallEnded(true);
        setShowCallModal(false);
        connectionRef.current?.destroy();
        window.location.reload(); // Simple way to reset call state
      });

      return () => {
        socket.off("new_message");
        socket.off("user_online");
        socket.off("user_offline");
        socket.off("messages_read");
        socket.off("call_user");
        socket.off("call_ended");
      };
    }
  }, [socket, activeChat, user]);

  const fetchChats = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      // Add system notifications chat at the top
      const notificationsChat = {
        id: "notifications-system",
        isGroup: false,
        name: "Notifications",
        chatMembers: [
          {
            user: {
              id: "system",
              username: "Notifications",
              avatar: null,
              isOnline: true,
            },
          },
        ],
        messages: [],
        createdAt: new Date().toISOString(),
      };

      // Add Sparkaph AI chat as second pinned chat
      const sparkaphAIChat = {
        id: "sparkaph-ai",
        isGroup: false,
        name: "Sparkaph AI",
        chatMembers: [
          {
            user: {
              id: "sparkaph-ai",
              username: "Sparkaph AI",
              avatar: "/logo-ai-sparkaph.png",
              isOnline: true,
            },
          },
        ],
        messages: [],
        createdAt: new Date().toISOString(),
      };

      setChats([notificationsChat, sparkaphAIChat, ...data]);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    // Don't fetch messages for system notifications chat
    if (chatId === "notifications-system") {
      setMessages([]);
      return;
    }

    // For Sparkaph AI chat, load local messages
    if (chatId === "sparkaph-ai") {
      const savedMessages = localStorage.getItem("sparkaph-ai-messages");
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([
          {
            id: "welcome",
            content: "Привет! Я Sparkaph AI - генератор мини-приложений. Опиши какой мини-апп тебе нужен, и я создам для тебя ZIP файл с готовым проектом!",
            senderId: "sparkaph-ai",
            chatId: "sparkaph-ai",
            type: "TEXT",
            createdAt: new Date().toISOString(),
            sender: { username: "Sparkaph AI", avatar: "/logo-ai-sparkaph.png" },
            statuses: [],
          },
        ]);
      }
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/chats/${chatId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setMessages(data);
        scrollToBottom();
        markMessagesAsRead(chatId);
      } else {
        console.error("Failed to fetch messages:", data);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/chats/${chatId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update local unread count
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    await sendTextMessage(newMessage);
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const onStickerClick = async (stickerUrl: string) => {
    if (!activeChat) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/chats/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: activeChat.id,
          content: "Sticker",
          type: "STICKER",
          fileUrl: stickerUrl,
        }),
      });
      setShowStickerPicker(false);
    } catch (error) {
      console.error("Error sending sticker:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const { url } = await uploadResponse.json();

      const type = file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("video/")
          ? "VIDEO"
          : file.type.startsWith("audio/")
            ? "AUDIO"
            : "DOCUMENT";

      await fetch(`${API_URL}/api/chats/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: activeChat.id,
          content: file.name,
          type,
          fileUrl: url,
        }),
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const sendTextMessage = async (content: string) => {
    if (!activeChat) return;

    // For Sparkaph AI chat, use AI API
    if (activeChat.id === "sparkaph-ai") {
      try {
        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          content,
          senderId: user?.id || "",
          chatId: "sparkaph-ai",
          type: "TEXT",
          createdAt: new Date().toISOString(),
          sender: { username: user?.username || "You", avatar: user?.avatar || null },
          statuses: [],
        };
        setMessages((prev) => {
          const newMessages = [...prev, userMessage];
          localStorage.setItem("sparkaph-ai-messages", JSON.stringify(newMessages));
          return newMessages;
        });

        // Check if user wants to create a mini-app
        const createAppKeywords = ["создай", "сделай", "генерируй", "создать", "сделать", "мини-апп", "приложение", "app"];
        const shouldCreateApp = createAppKeywords.some(keyword =>
          content.toLowerCase().includes(keyword)
        );

        if (shouldCreateApp) {
          // Generate ZIP
          const response = await fetch(`${API_URL}/api/ai/generate-zip`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ description: content }),
          });

          const data = await response.json();
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "Я создал для тебя мини-апп! Скачай ZIP файл и открой index.html в браузере. " + data.zipUrl,
            senderId: "sparkaph-ai",
            chatId: "sparkaph-ai",
            type: "TEXT",
            createdAt: new Date().toISOString(),
            sender: { username: "Sparkaph AI", avatar: "/logo-ai-sparkaph.png" },
            statuses: [],
          };
          setMessages((prev) => {
            const newMessages = [...prev, aiMessage];
            localStorage.setItem("sparkaph-ai-messages", JSON.stringify(newMessages));
            return newMessages;
          });
        } else {
          // Regular chat
          const response = await fetch(`${API_URL}/api/ai/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ message: content }),
          });

          const data = await response.json();
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: data.response,
            senderId: "sparkaph-ai",
            chatId: "sparkaph-ai",
            type: "TEXT",
            createdAt: new Date().toISOString(),
            sender: { username: "Sparkaph AI", avatar: "/logo-ai-sparkaph.png" },
            statuses: [],
          };
          setMessages((prev) => {
            const newMessages = [...prev, aiMessage];
            // Save all messages to localStorage
            localStorage.setItem("sparkaph-ai-messages", JSON.stringify(newMessages));
            return newMessages;
          });
        }
      } catch (error) {
        console.error("Error sending message to Sparkaph AI:", error);
      }
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/chats/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: activeChat.id,
          content,
          type: "TEXT",
        }),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!activeChat) return;
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", audioBlob, "voice-message.webm");

      const uploadResponse = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const { url } = await uploadResponse.json();

      await fetch(`${API_URL}/api/chats/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: activeChat.id,
          content: "Voice Message",
          type: "VOICE",
          fileUrl: url,
        }),
      });
    } catch (error) {
      console.error("Error sending voice message:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    socket?.disconnect();
    navigate("/login");
  };

  const handleUpdateProfile = (updatedUser: any) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) return chat.name || t("group_chat");
    if (chat.app) return chat.app.name;
    const partner = chat.chatMembers?.find((m) => m.user.id !== user?.id);
    return partner?.user.username || t("unknown_user");
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) return null;
    const partner = chat.chatMembers?.find((m) => m.user.id !== user?.id);
    return partner?.user.avatar;
  };

  const getChatStatus = (chat: Chat) => {
    if (chat.isGroup) return null;
    return null;
  };

  const getMessageStatusIcon = (msg: Message) => {
    if (msg.senderId !== user?.id) return null;

    // Check if read by anyone (for private chat, this is enough)
    const isRead = msg.statuses?.some(
      (s) => s.status === "READ" && s.userId !== user.id,
    );

    if (isRead) {
      return (
        <div className="flex items-center gap-0.5" title="Read">
          <CheckCheck size={14} className="text-[#007AFF] drop-shadow-sm" />
        </div>
      );
    }

    // Check if delivered (user is online)
    const chat = chats.find((c) => c.id === msg.chatId);
    const partner = chat?.chatMembers.find((m) => m.user.id !== user.id);
    const isDelivered = partner?.user.isOnline;

    if (isDelivered) {
      return (
        <div className="flex items-center gap-0.5" title="Delivered">
          <CheckCheck size={14} className="text-white/50" />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-0.5" title="Sent">
        <Check size={14} className="text-white/40" />
      </div>
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const token = localStorage.getItem("token");

        // Search users
        const usersResponse = await fetch(
          `${API_URL}/api/users/search?query=${query}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const usersData = await usersResponse.json();

        // Search apps
        const appsResponse = await fetch(
          `${API_URL}/api/apps/search?query=${query}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const appsData = await appsResponse.json();

        // Combine results - users first, then apps
        const combinedResults = [
          ...(Array.isArray(usersData) ? usersData : []),
          ...(Array.isArray(appsData)
            ? appsData.map((app: any) => ({ ...app, isApp: true }))
            : []),
        ];

        setSearchResults(combinedResults);
      } catch (error) {
        console.error("Error searching:", error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleGroupMemberSearch = async (query: string) => {
    if (query.length > 0) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/users/search?query=${query}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await response.json();
        setAvailableUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    } else {
      setAvailableUsers([]);
    }
  };

  const startChat = async (partnerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partnerId, isGroup: false }),
      });
      const chat = await response.json();
      setChats((prev) => {
        const exists = prev.find((c) => c.id === chat.id);
        if (exists) return prev;
        return [chat, ...prev];
      });
      setActiveChat(chat);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const openAppChat = async (appId: string) => {
    try {
      console.log('🚀 openAppChat called with appId:', appId);
      
      // Автоматически сворачиваем мессенджер при открытии мини-апп
      setIsChatListCollapsed(true);
      
      const token = localStorage.getItem("token");

      // First check if chat already exists in current chats
      const existingChat = chats.find((c) => c.app?.id === appId);
      console.log('📋 Existing chat found:', existingChat);
      if (existingChat) {
        console.log('✅ Opening existing chat');
        setActiveChat(existingChat);
        setSearchQuery("");
        setSearchResults([]);
        return;
      }

      // Join app chat
      console.log('📡 Joining app chat...');
      const response = await fetch(
        `${API_URL}/api/apps/${appId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('📡 Response status:', response.status);
      if (response.ok) {
        const chat = await response.json();
        console.log('✅ Chat joined successfully:', chat);
        setChats((prev) => [chat, ...prev]);
        setActiveChat(chat);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        const errorData = await response.json();
        console.error("❌ Failed to join app chat:", response.status, errorData);
      }
    } catch (error) {
      console.error("❌ Error joining app chat:", error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Delete this chat? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setChats(chats.filter((c) => c.id !== chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const handleArchiveChat = (chatId: string) => {
    const chatToArchive = chats.find((c) => c.id === chatId);
    if (chatToArchive) {
      setArchivedChats([...archivedChats, chatToArchive]);
      setChats(chats.filter((c) => c.id !== chatId));
      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
    }
  };

  const handleUnarchiveChat = (chatId: string) => {
    const chatToUnarchive = archivedChats.find((c) => c.id === chatId);
    if (chatToUnarchive) {
      setChats([chatToUnarchive, ...chats]);
      setArchivedChats(archivedChats.filter((c) => c.id !== chatId));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showAlert("Please enter a group name", "error");
      return;
    }

    if (selectedMembers.length === 0) {
      showAlert("Please select at least one member", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          memberIds: selectedMembers,
        }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setChats([newGroup, ...chats]);
        setShowCreateGroup(false);
        setGroupName("");
        setSelectedMembers([]);
        setGroupMemberSearch("");
        showAlert("Group created successfully!", "success");
      } else {
        const error = await response.json();
        showAlert(error.message || "Failed to create group", "error");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      showAlert("Failed to create group", "error");
    }
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBlockUser = async () => {
    if (!activeChat) return;
    const partner = activeChat.chatMembers.find((m) => m.user.id !== user?.id);
    if (!partner) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      `${t("block_user_confirm")} ${partner.user.username}?`
    );
    
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/blocks/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: partner.user.id }),
      });
      showAlert(t("user_blocked_success"), "success");
      setActiveChat(null);
    } catch (error) {
      console.error("Error blocking user:", error);
      showAlert(t("user_blocked_failed"), "error");
    }
  };

  const callUser = (isVideo: boolean) => {
    setIsVideoCall(isVideo);
    setShowCallModal(true);
    navigator.mediaDevices
      .getUserMedia({ video: isVideo, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: currentStream,
        });

        peer.on("signal", (data) => {
          if (activeChat && socket) {
            const partner = activeChat.chatMembers.find(
              (m) => m.user.id !== user?.id,
            );
            if (partner) {
              socket.emit("call_user", {
                userToCall: partner.user.id,
                signalData: data,
                from: user.id,
                name: user.username,
              });
            }
          }
        });

        peer.on("stream", (currentStream) => {
          if (userVideo.current) {
            userVideo.current.srcObject = currentStream;
          }
        });

        socket?.on("call_accepted", (signal) => {
          setCallAccepted(true);
          peer.signal(signal);
        });

        connectionRef.current = peer;
      });
  };

  const answerCall = () => {
    setCallAccepted(true);
    navigator.mediaDevices
      .getUserMedia({ video: isVideoCall, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: currentStream,
        });

        peer.on("signal", (data) => {
          socket?.emit("answer_call", { signal: data, to: caller });
        });

        peer.on("stream", (currentStream) => {
          if (userVideo.current) {
            userVideo.current.srcObject = currentStream;
          }
        });

        peer.signal(callerSignal);
        connectionRef.current = peer;
      });
  };

  const leaveCall = () => {
    setCallEnded(true);
    setShowCallModal(false);
    connectionRef.current?.destroy();
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    // Notify other user
    if (activeChat && socket) {
      const partner = activeChat.chatMembers.find(
        (m) => m.user.id !== user?.id,
      );
      if (partner) {
        socket.emit("end_call", { to: partner.user.id });
      }
    }
  };

  return (
    <>
      {alerts.map((alert) => (
        <CustomAlert
          key={alert.id}
          message={alert.message}
          type={alert.type}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
      <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
        <Sidebar user={user} onLogout={handleLogout} isMessengerCollapsed={isChatListCollapsed} setIsMessengerCollapsed={setIsChatListCollapsed} />
        {showCallModal && (
        <CallModal
          stream={stream}
          callAccepted={callAccepted}
          callEnded={callEnded}
          userVideo={userVideo as React.RefObject<HTMLVideoElement>}
          myVideo={myVideo as React.RefObject<HTMLVideoElement>}
          name={name || (activeChat ? getChatName(activeChat) : "Unknown")}
          leaveCall={leaveCall}
          answerCall={answerCall}
          receivingCall={receivingCall}
          isVideo={isVideoCall}
        />
        )}
        {/* Chat List */}
        <div
          className={`w-full md:w-96 lg:w-[400px] glass-strong border-r border-[var(--color-separator)] flex flex-col flex-shrink-0 ${activeChat ? "hidden md:flex" : "flex"} ${isChatListCollapsed ? "!hidden" : ""}`}
        >
        <div className="p-4 border-b border-[var(--color-separator)]">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold text-[var(--color-text)]">{showArchived ? t("archived") : t("chats")}</h1>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="btn-glass-secondary flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="text-sm">Group</span>
            </button>
          </div>
          
          {/* Archive Bar - WhatsApp Style */}
          {!showArchived && archivedChats.length > 0 && (
            <button
              onClick={() => setShowArchived(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl backdrop-blur-[60px] saturate-[180%] bg-[var(--color-glass-button)] border border-[var(--color-glass-border)] hover:bg-[var(--color-glass-button-hover)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-ios-blue)]/20 flex items-center justify-center">
                  <Archive size={20} className="text-[var(--color-ios-blue)]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{t("archived")}</p>
                  <p className="text-xs text-[var(--color-tertiary-text)]">{archivedChats.length} {archivedChats.length === 1 ? t("group_chat").toLowerCase() : t("chats").toLowerCase()}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[var(--color-tertiary-text)] group-hover:text-[var(--color-text)] transition-colors" />
            </button>
          )}
          
          {showArchived && (
            <button
              onClick={() => setShowArchived(false)}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-glass-button)] transition-all text-[var(--color-ios-blue)]"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Back to Chats</span>
            </button>
          )}
        </div>

        <div className="p-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tertiary-text)]"
                  size={16}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t("search")}
                  className="input w-full pl-10 text-sm"
                />
              </div>
              {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 glass rounded-xl overflow-hidden shadow-elevated">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => {
                    console.log('Search result clicked:', result);
                    if (result.isApp) {
                      console.log('Opening app chat:', result.id);
                      openAppChat(result.id);
                    } else {
                      console.log('Starting user chat:', result.id);
                      startChat(result.id);
                    }
                  }}
                  className="p-3 hover:bg-[var(--color-separator)] cursor-pointer flex items-center gap-3 border-b border-[var(--color-separator)]/30 last:border-0"
                >
                  {result.isApp ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-ios-orange)] to-[var(--color-ios-pink)] flex items-center justify-center">
                        <Code size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-[var(--color-text)] block">
                          {result.name}
                        </span>
                        <span className="text-xs text-[var(--color-tertiary-text)]">
                          @{result.handle}
                        </span>
                      </div>
                      <Globe
                        size={14}
                        className="text-[var(--color-ios-blue)]"
                      />
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full icon-gradient flex items-center justify-center">
                        <span className="text-xs text-white font-semibold">
                          {result.username?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <span className="text-sm text-[var(--color-text)]">
                        {result.username}
                      </span>
                      <Plus
                        size={14}
                        className="ml-auto text-[var(--color-ios-blue)]"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {showArchived ? (
            archivedChats.map((chat) => {
              const avatar = chat.id === "sparkaph-ai" ? "/logo-ai-sparkaph.png" : getChatAvatar(chat);
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 cursor-pointer hover:bg-[var(--color-separator)] transition-colors border-b border-[var(--color-separator)] ${
                    activeChat?.id === chat.id
                      ? "bg-[var(--color-separator)] border-l-4 border-l-[var(--color-ios-blue)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                          chat.id === "notifications-system"
                            ? "bg-gradient-to-br from-[var(--color-ios-blue)] to-[var(--color-ios-indigo)]"
                            : "bg-[var(--color-tertiary-background)]"
                        }`}
                      >
                        {chat.id === "notifications-system" ? (
                          <Bell size={20} className="text-white" />
                        ) : avatar ? (
                          <img
                            src={
                              avatar.startsWith("http")
                                ? avatar
                                : avatar.startsWith("/")
                                  ? avatar
                                  : `${API_URL}${avatar}`
                            }
                            alt={getChatName(chat) || ""}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/logo.png";
                            }}
                          />
                        ) : (
                          <span className="text-sm text-[var(--color-ios-blue)] font-semibold">
                            {(getChatName(chat) || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-[var(--color-text)]">
                          {getChatName(chat)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnarchiveChat(chat.id);
                          }}
                          className="text-xs text-[var(--color-ios-blue)] hover:underline"
                        >
                          {t("unarchive")}
                        </button>
                      </div>
                      <p className="text-sm text-[var(--color-tertiary-text)] truncate">
                        {t("archived_chat")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            chats.map((chat) => {
            const avatar = chat.id === "sparkaph-ai" ? "/logo-ai-sparkaph.png" : getChatAvatar(chat);
            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`p-4 cursor-pointer hover:bg-[var(--color-separator)] transition-colors border-b border-[var(--color-separator)] ${
                  activeChat?.id === chat.id
                    ? "bg-[var(--color-separator)] border-l-4 border-l-[var(--color-ios-blue)]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                        chat.id === "notifications-system"
                          ? "bg-gradient-to-br from-[var(--color-ios-blue)] to-[var(--color-ios-indigo)]"
                          : "bg-[var(--color-tertiary-background)]"
                      }`}
                    >
                      {chat.id === "notifications-system" ? (
                        <Bell size={20} className="text-white" />
                      ) : avatar ? (
                        <img
                          src={
                            avatar.startsWith("http")
                              ? avatar
                              : avatar.startsWith("/")
                                ? avatar
                                : `${API_URL}${avatar}`
                          }
                          alt={getChatName(chat) || ""}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/logo.png";
                          }}
                        />
                      ) : (
                        <span className="text-sm text-[var(--color-ios-blue)] font-semibold">
                          {(getChatName(chat) || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {!chat.isGroup && (
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--color-background)] ${
                          chat.chatMembers.find((m) => m.user.id !== user?.id)
                            ?.user.isOnline
                            ? "bg-[var(--color-ios-green)]"
                            : "bg-[var(--color-tertiary-text)]"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
                        {getChatName(chat)}
                      </h3>
                      <div className="flex items-center gap-2">
                        {chat.messages?.[0] && (
                          <span className="text-xs text-[var(--color-tertiary-text)]">
                            {new Date(
                              chat.messages[0].createdAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {chat.id !== "notifications-system" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveChat(chat.id);
                              }}
                              className="text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-blue)] transition-colors p-1"
                              title="Archive"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 8v13H3V8" />
                                <path d="M1 3h22v5H1z" />
                                <path d="M10 12h4" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id);
                              }}
                              className="text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-red)] transition-colors p-1"
                              title="Delete"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                          </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      {chat.messages?.[0] ? (
                        <p className={`text-sm truncate flex-1 ${chat.unreadCount > 0 ? "text-[var(--color-text)] font-semibold" : "text-[var(--color-tertiary-text)]"}`}>
                          {chat.messages[0].senderId === user?.id && (
                            <span className="text-[var(--color-ios-blue)]">You: </span>
                          )}
                          {chat.messages[0].type === "VOICE"
                            ? t("voice_message")
                            : chat.messages[0].type === "STICKER"
                              ? t("sticker")
                              : chat.messages[0].content}
                        </p>
                      ) : (
                        <p className={`text-sm truncate flex-1 ${chat.chatMembers.find((m) => m.user.id !== user?.id)?.user.isOnline ? "text-[var(--color-ios-green)]" : "text-[var(--color-tertiary-text)]"}`}>
                          {chat.chatMembers.find((m) => m.user.id !== user?.id)?.user.isOnline ? t("online") : t("offline")}
                        </p>
                      )}
                      {chat.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
          )}
      </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col relative ${!activeChat ? "hidden md:flex" : "flex"}`}
      >
        {activeChat ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-16 glass-strong border-b border-[var(--color-separator)] flex items-center px-4 md:px-6 justify-between z-10 backdrop-blur-[60px] saturate-[180%]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] mr-2 p-2 rounded-lg hover:bg-[var(--color-glass-button)] transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div
                  className={`flex items-center gap-3 ${activeChat.id !== "notifications-system" && !activeChat.app ? "cursor-pointer hover:opacity-80" : ""} transition-opacity`}
                  onClick={() => {
                    if (
                      activeChat.id === "notifications-system" ||
                      activeChat.app
                    )
                      return;
                    const partner = activeChat.chatMembers.find(
                      (m) => m.user.id !== user?.id,
                    );
                    if (partner && partner.user.id !== "system") {
                      navigate(`/user/${partner.user.username}`);
                    }
                  }}
                >
                  {activeChat.app ? (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-ios-orange)] to-[var(--color-ios-pink)] flex items-center justify-center">
                        <Code size={20} className="text-white" />
                      </div>
                      <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => {
                        activeChat.app && navigate(`/${activeChat.app.handle}`);
                        // Автоматически сворачиваем мессенджер при открытии мини-апп
                        setIsChatListCollapsed(true);
                      }}>
                        <h2 className="text-sm font-semibold text-[var(--color-text)]">
                          {activeChat.app?.name}
                        </h2>
                        <span 
                          className="text-xs text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-blue)] cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeChat.app?.user?.username) {
                              navigate(`/user/${activeChat.app.user.username}`);
                            }
                          }}
                        >
                          by @{activeChat.app?.user?.username || "developer"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`w-10 h-10 rounded-full ${activeChat.id === "notifications-system" ? "" : "icon-gradient p-[2px]"}`}
                      >
                        <div
                          className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${
                            activeChat.id === "notifications-system"
                              ? "bg-gradient-to-br from-[var(--color-ios-blue)] to-[var(--color-ios-indigo)]"
                              : "bg-[var(--color-tertiary-background)]"
                          }`}
                        >
                          {activeChat.id === "notifications-system" ? (
                            <Bell size={20} className="text-white" />
                          ) : activeChat.id === "sparkaph-ai" ? (
                            <img
                              src="/logo-ai-sparkaph.png"
                              alt="Sparkaph AI"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/logo.png";
                              }}
                            />
                          ) : getChatAvatar(activeChat) ? (
                            <img
                              src={
                                getChatAvatar(activeChat)!.startsWith("http")
                                  ? getChatAvatar(activeChat)!
                                  : `${API_URL}${getChatAvatar(activeChat)}`
                              }
                              alt={getChatName(activeChat) || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-[var(--color-text)] font-semibold">
                              {(getChatName(activeChat) || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-[var(--color-text)]">
                          {getChatName(activeChat)}
                        </h2>
                        <span className="text-xs text-[var(--color-ios-blue)]">
                          {getChatStatus(activeChat)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {activeChat.id !== "notifications-system" && !activeChat.app && activeChat.id !== "sparkaph-ai" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const chatUrl = window.location.origin + `/chat/${activeChat.id}`;
                      navigator.clipboard.writeText(chatUrl);
                      showAlert(t("chat_link_copied"), "success");
                    }}
                    className="p-2 rounded-lg text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-green)] hover:bg-[var(--color-glass-button)] transition-all backdrop-blur-[60px] saturate-[180%]"
                    title={t("copy_chat_link")}
                  >
                    <Link size={20} />
                  </button>
                  <button
                    onClick={() => callUser(false)}
                    className="p-2 rounded-lg text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-orange)] hover:bg-[var(--color-glass-button)] transition-all backdrop-blur-[60px] saturate-[180%]"
                  >
                    <Phone size={20} />
                  </button>
                  <button
                    onClick={() => callUser(true)}
                    className="p-2 rounded-lg text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-blue)] hover:bg-[var(--color-glass-button)] transition-all backdrop-blur-[60px] saturate-[180%]"
                  >
                    <Video size={20} />
                  </button>
                  {!activeChat.isGroup && (
                    <button
                      onClick={handleBlockUser}
                      className="p-2 rounded-lg text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-red)] hover:bg-[var(--color-glass-button)] transition-all backdrop-blur-[60px] saturate-[180%]"
                    >
                      <Ban size={20} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Messages or App */}
            {activeChat.app ? (
              // App iframe - opens directly
              <div className="flex-1 overflow-hidden relative">
                <iframe
                  src={`${APPS_URL}/${activeChat.app.handle}/index.html`}
                  title={activeChat.app.name}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
                />
              </div>
            ) : (
              // Regular Chat Messages
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-2 md:space-y-3 scroll-smooth">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}
                    >
                      {!isMe && msg.senderId === "sparkaph-ai" && (
                        <img
                          src="/logo-ai-sparkaph.png"
                          alt="Sparkaph AI"
                          className="w-8 h-8 rounded-full object-contain flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/logo.png";
                          }}
                        />
                      )}
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl backdrop-blur-[60px] saturate-[180%] shadow-lg ${
                          isMe
                            ? "bg-[var(--color-ios-blue)]/30 border border-[var(--color-ios-blue)]/50 rounded-tr-sm"
                            : "bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 rounded-tl-sm"
                        }`}
                      >
                        {!isMe && (
                          <p className="text-[10px] text-[var(--color-ios-orange)] font-semibold mb-1">
                            {msg.sender.username}
                          </p>
                        )}
                        {msg.type === "VOICE" ? (
                          <AudioPlayer src={msg.fileUrl || ""} />
                        ) : msg.type === "STICKER" ? (
                          <img
                            src={msg.fileUrl}
                            alt="Sticker"
                            className="w-32 h-32 object-contain"
                          />
                        ) : msg.type === "IMAGE" ? (
                          <img
                            src={msg.fileUrl}
                            alt="Image"
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-image.png';
                              e.currentTarget.onerror = null;
                            }}
                          />
                        ) : msg.type === "VIDEO" ? (
                          <video
                            src={msg.fileUrl}
                            controls
                            className="max-w-full rounded-lg"
                          />
                        ) : msg.type === "AUDIO" ? (
                          <audio
                            src={msg.fileUrl}
                            controls
                            className="max-w-full"
                          />
                        ) : (
                          <p className="text-sm text-[var(--color-text)]">
                            {msg.content}
                          </p>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className="text-[10px] text-[var(--color-tertiary-text)]">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {getMessageStatusIcon(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-2 md:p-4 glass-strong border-t border-[var(--color-separator)] flex-shrink-0 backdrop-blur-[60px] saturate-[180%]">
                {activeChat.id === "notifications-system" ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-[var(--color-tertiary-text)]">
                      System notifications appear here
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-1.5 md:gap-2 items-center">
                    {showEmojiPicker && (
                      <CustomEmojiPicker onEmojiClick={onEmojiClick} />
                    )}
                    {showStickerPicker && (
                      <StickerPicker onStickerClick={onStickerClick} />
                    )}
                    <button
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowStickerPicker(false);
                      }}
                      className="p-1.5 md:p-2 rounded-lg text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-orange)] hover:bg-[var(--color-glass-button)] transition-all"
                    >
                      <Smile size={20} className="md:w-[22px] md:h-[22px]" />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 md:p-2 rounded-lg text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-green)] hover:bg-[var(--color-glass-button)] transition-all"
                    >
                      <Paperclip size={20} className="md:w-[22px] md:h-[22px]" />
                    </button>
                    <div className="hidden md:block">
                      <VoiceRecorder onSend={sendVoiceMessage} />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,audio/*"
                    />
                    <form
                      onSubmit={sendMessage}
                      className="flex-1 flex gap-1.5 md:gap-2"
                    >
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message..."
                        className="input flex-1 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-sm backdrop-blur-[60px] saturate-[180%]"
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-[var(--color-ios-blue)] hover:bg-[var(--color-ios-blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 md:p-3 rounded-xl transition-all flex items-center justify-center min-w-[40px] md:min-w-[48px]"
                      >
                        <Send size={18} className="md:w-5 md:h-5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-tertiary-text)]">
            <div className="w-40 h-40 mb-6">
              <img 
                src="/logo.png" 
                alt="Sparkaph Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <p className="font-semibold text-lg mb-2 text-[var(--color-text)]">
              {t("welcome")}
            </p>
            <p className="text-sm text-[var(--color-tertiary-text)]">
              {t("select_chat")}
            </p>
          </div>
        )}
      </div>

      {/* Hide BottomNav on mobile when chat is active */}
      <div className={`${activeChat ? "hidden md:block" : "block"}`}>
        <BottomNav />
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-strong rounded-3xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-6">Create Group</h2>
            
            {/* Group Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-[var(--color-tertiary-background)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-separator)] transition-colors">
                <span className="text-4xl">👥</span>
              </div>
            </div>
            
            {/* Group Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Group Name</label>
              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input w-full"
              />
            </div>
            
            {/* Members Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">
                Members ({selectedMembers.length} selected)
              </label>
              
              {/* Search Input */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={groupMemberSearch}
                  onChange={(e) => {
                    setGroupMemberSearch(e.target.value);
                    handleGroupMemberSearch(e.target.value);
                  }}
                  className="input w-full"
                />
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {availableUsers.length > 0 ? (
                  availableUsers
                    .filter(u => u.id !== user?.id)
                    .map((result) => (
                    <div
                      key={result.id}
                      onClick={() => toggleMemberSelection(result.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors ${
                        selectedMembers.includes(result.id)
                          ? "bg-[var(--color-ios-blue)]/20 border-2 border-[var(--color-ios-blue)]"
                          : "bg-[var(--color-tertiary-background)] hover:bg-[var(--color-separator)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center text-white font-semibold">
                          {result.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-[var(--color-text)]">{result.username}</span>
                        {selectedMembers.includes(result.id) && (
                          <div className="ml-auto w-6 h-6 rounded-full bg-[var(--color-ios-blue)] flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[var(--color-tertiary-text)] py-8">
                    {groupMemberSearch ? "No users found" : "Search for users to add to the group"}
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName("");
                  setSelectedMembers([]);
                }}
                className="btn-glass flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="btn-glass-primary flex-1"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default Chat;
