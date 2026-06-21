import React, { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { API_URL } from "../config";
import { io, Socket } from "socket.io-client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  fromUser?: {
    id: string;
    username: string;
    avatar: string;
  };
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Initialize Socket.io connection
    const user = localStorage.getItem("user");
    if (user) {
      const userData = JSON.parse(user);
      const newSocket = io(API_URL);
      
      newSocket.on("connect", () => {
        console.log("Socket connected for notifications");
        newSocket.emit("setup", userData.id);
      });

      // Listen for new notifications
      newSocket.on("notification", (notification: Notification) => {
        console.log("New notification received:", notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
        if (Notification.permission === "granted") {
          new Notification(notification.title, {
            body: notification.message,
            icon: notification.fromUser?.avatar || "/logo.png",
          });
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Только что";
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} д назад`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications) fetchNotifications();
        }}
        className="relative p-2 hover:bg-[var(--color-separator)]/50 rounded-xl transition-colors"
      >
        <Bell size={24} className="text-[var(--color-text)]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-[var(--color-ios-red)] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-h-[500px] overflow-y-auto glass-strong rounded-2xl shadow-elevated z-50">
            {/* Header */}
            <div className="sticky top-0 glass-strong border-b border-[var(--color-separator)] p-4 flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-text)]">Уведомления</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[var(--color-ios-blue)] hover:underline flex items-center gap-1"
                >
                  <Check size={14} />
                  Прочитать все
                </button>
              )}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-tertiary-text)]">
                Нет уведомлений
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-[var(--color-separator)] hover:bg-[var(--color-separator)]/30 transition-colors ${
                      !notification.isRead ? "bg-[var(--color-ios-blue)]/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {notification.fromUser && (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {notification.fromUser.avatar ? (
                            <img
                              src={
                                notification.fromUser.avatar.startsWith("http")
                                  ? notification.fromUser.avatar
                                  : `${API_URL}${notification.fromUser.avatar}`
                              }
                              alt={notification.fromUser.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[var(--color-ios-blue)] to-[var(--color-ios-purple)] flex items-center justify-center text-white font-bold">
                              {notification.fromUser.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--color-text)] font-medium">
                          {notification.title}
                        </p>
                        <p className="text-xs text-[var(--color-secondary-text)] mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[var(--color-tertiary-text)] mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-[var(--color-separator)] rounded transition-colors"
                            title="Отметить как прочитанное"
                          >
                            <Check size={16} className="text-[var(--color-ios-blue)]" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-[var(--color-separator)] rounded transition-colors"
                          title="Удалить"
                        >
                          <X size={16} className="text-[var(--color-tertiary-text)]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
