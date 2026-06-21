import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Code,
  MessageCircle,
  ArrowLeft,
  Eye,
  User,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ToastContainer";
import { API_URL } from '../config';

interface App {
  id: string;
  name: string;
  handle: string;
  description: string;
  icon?: string;
  views: number;
  isPublic: boolean;
  status: string;
  type: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  deployments: any[];
}

const AppProfile: React.FC = () => {
  const params = useParams<{ handle: string }>();
  const handle = params.handle;
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toasts, success, error, removeToast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchAppProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/apps/handle/${handle}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        const data = await response.json();
        if (response.ok) {
          setApp(data);
        } else {
          navigate("/apps");
        }
      } catch (err) {
        console.error("Error fetching app profile:", err);
        navigate("/apps");
      } finally {
        setLoading(false);
      }
    };

    if (handle) {
      fetchAppProfile();
    }
  }, [handle, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleOpenApp = () => {
    if (app) {
      navigate(`/${app.handle}`);
    }
  };

  const handleChatWithDeveloper = () => {
    if (app) {
      navigate(`/chat?userId=${app.user.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[var(--color-background)] items-center justify-center">
        <div className="glass rounded-3xl p-8">
          <div className="animate-pulse text-[var(--color-text)] font-medium">
            Loading app profile...
          </div>
        </div>
      </div>
    );
  }

  if (!app || !currentUser) {
    return null;
  }

  const latestDeployment = app.deployments.find((d) => d.status === "DEPLOYED");

  return (
    <>
      <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
        <Sidebar user={currentUser} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-40 glass-strong border-b border-[var(--color-separator)]">
            <div className="w-full px-4 md:px-6 py-4 flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-[var(--color-separator)]/50 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} className="text-[var(--color-text)]" />
              </button>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                {app.name}
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
            <div className="w-full">
              {/* App Header */}
              <div className="relative">
                {/* Cover Photo */}
                <div className="h-48 md:h-64 bg-gradient-to-br from-[var(--color-ios-orange)] to-[var(--color-ios-pink)]"></div>
                
                {/* App Icon */}
                <div className="absolute -bottom-16 left-4 md:left-8">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-[var(--color-ios-orange)] to-[var(--color-ios-pink)] p-[3px] shadow-2xl bg-[var(--color-background)]">
                    <div className="w-full h-full rounded-xl bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                      {app.icon ? (
                        <img
                          src={
                            app.icon.startsWith("http")
                              ? app.icon
                              : `${API_URL}${app.icon}`
                          }
                          alt={app.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Code size={48} className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* App Info */}
              <div className="px-4 md:px-8 pt-20 pb-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-1">
                      {app.name}
                    </h1>
                    <p className="text-base md:text-lg text-[var(--color-ios-blue)] mb-2">
                      /{app.handle}
                    </p>
                    <p className="text-sm md:text-base text-[var(--color-secondary-text)] leading-relaxed mb-4">
                      {app.description || "No description provided"}
                    </p>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      {app.status === "PUBLISHED" && (
                        <span className="px-3 py-1 bg-gradient-to-br from-[var(--color-ios-green)] to-[var(--color-ios-teal)] text-white text-xs font-bold rounded-full shadow-md">
                          Published
                        </span>
                      )}
                      {app.type === "HOSTED" && (
                        <span className="px-3 py-1 bg-[var(--color-ios-blue)]/20 text-[var(--color-ios-blue)] text-xs font-bold rounded-full">
                          Hosted
                        </span>
                      )}
                      {app.type === "EXTERNAL" && (
                        <span className="px-3 py-1 bg-[var(--color-ios-purple)]/20 text-[var(--color-ios-purple)] text-xs font-bold rounded-full">
                          External
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-xl font-bold text-[var(--color-text)]">
                          {app.views || 0}
                        </p>
                        <p className="text-xs text-[var(--color-tertiary-text)] flex items-center gap-1">
                          <Eye size={12} />
                          Views
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {latestDeployment && (
                      <button
                        onClick={handleOpenApp}
                        className="btn-glass-primary flex items-center justify-center gap-2 px-6 py-3"
                      >
                        <ExternalLink size={20} />
                        <span>Open App</span>
                      </button>
                    )}
                    <button
                      onClick={handleChatWithDeveloper}
                      className="glass rounded-2xl font-semibold hover:shadow-card transition-all flex items-center justify-center gap-2 text-[var(--color-text)] px-6 py-3"
                    >
                      <MessageCircle size={20} />
                      <span className="hidden sm:inline">Chat</span>
                    </button>
                  </div>
                </div>

                {/* Developer Info */}
                <div className="mt-6 glass rounded-2xl p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full icon-gradient p-[2px]">
                      <div className="w-full h-full rounded-full bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                        {app.user.avatar ? (
                          <img
                            src={app.user.avatar.startsWith("http") ? app.user.avatar : `${API_URL}${app.user.avatar}`}
                            alt={app.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-[var(--color-text)] font-bold">
                            {app.user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm text-[var(--color-tertiary-text)]">
                        Developer
                      </h3>
                      <p 
                        className="text-base font-semibold text-[var(--color-text)] cursor-pointer hover:text-[var(--color-ios-blue)]"
                        onClick={() => navigate(`/user/${app.user.username}`)}
                      >
                        @{app.user.username}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/user/${app.user.username}`)}
                      className="p-2 hover:bg-[var(--color-separator)]/50 rounded-xl transition-colors"
                    >
                      <User size={20} className="text-[var(--color-tertiary-text)]" />
                    </button>
                  </div>
                </div>

                {!latestDeployment && (
                  <div className="mt-6 glass rounded-2xl p-6 shadow-card">
                    <div className="text-center">
                      <Code size={48} className="mx-auto text-[var(--color-tertiary-text)] mb-4" />
                      <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
                        App Not Deployed
                      </h3>
                      <p className="text-sm text-[var(--color-secondary-text)]">
                        This app has been created but has no active deployment yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <BottomNav />
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

export default AppProfile;
