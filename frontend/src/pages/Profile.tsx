import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Code, Users, UserPlus, Shield, Settings, LogOut } from "lucide-react";
import ProfileSettings from "../components/ProfileSettings";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { API_URL, APPS_URL, WS_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Fetch data only once
        if (parsedUser) {
          fetchFollowers();
          fetchFollowing();
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/followers/followers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.status === 429) {
        console.warn("Rate limit exceeded, skipping followers fetch");
        return;
      }
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setFollowers(data);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/followers/following`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.status === 429) {
        console.warn("Rate limit exceeded, skipping following fetch");
        return;
      }
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setFollowing(data);
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  const handleUpdate = (updatedUser: any) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/followers/unfollow/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFollowing();
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-40 glass-strong border-b border-[var(--color-separator)]">
          <div className="w-full px-4 md:px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {t("profile_settings")}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/settings")}
                className="p-2 rounded-xl hover:bg-[var(--color-separator)]/50 transition-colors text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-blue)]"
                title="Settings"
              >
                <Settings size={24} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-[var(--color-ios-red)]/20 transition-colors text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-red)]"
                title="Logout"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="w-full px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto">
            {/* Profile Header */}
            <div className="glass rounded-3xl p-6 md:p-8 mb-6 md:mb-8 shadow-elevated">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl icon-gradient p-[3px] shadow-card">
                  <div className="w-full h-full rounded-[22px] bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={
                          user.avatar.startsWith("http")
                            ? user.avatar
                            : `${API_URL}${user.avatar}`
                        }
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl md:text-5xl text-[var(--color-text)] font-bold">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
                    {user.username}
                  </h1>
                  {user.nickname && (
                    <p className="text-base md:text-lg text-[var(--color-ios-blue)] mb-3">
                      @{user.nickname}
                    </p>
                  )}
                  <p className="text-sm md:text-base text-[var(--color-secondary-text)] leading-relaxed">
                    {user.bio || "No bio yet"}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-4 md:gap-6 mt-4 justify-center md:justify-start">
                    <div className="text-center md:text-left">
                      <div className="text-lg md:text-xl font-bold text-[var(--color-text)]">
                        {followers.length}
                      </div>
                      <div className="text-xs md:text-sm text-[var(--color-tertiary-text)]">
                        {t("followers")}
                      </div>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="text-lg md:text-xl font-bold text-[var(--color-text)]">
                        {following.length}
                      </div>
                      <div className="text-xs md:text-sm text-[var(--color-tertiary-text)]">
                        {t("following")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {user.isDeveloper && (
              <button
                onClick={() => navigate("/developer")}
                className="w-full mb-4 md:mb-6 glass rounded-3xl p-5 md:p-6 flex items-center gap-4 hover:shadow-elevated transition-all group shadow-card"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[var(--color-ios-orange)] to-[var(--color-ios-pink)] flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
                  <Code size={24} className="text-white md:w-7 md:h-7" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-base md:text-lg font-bold text-[var(--color-text)] block">
                    {t("developer_dashboard")}
                  </span>
                  <span className="text-sm md:text-base text-[var(--color-tertiary-text)]">
                    {t("my_apps")}
                  </span>
                </div>
              </button>
            )}

            {/* Tabs */}
            <div className="glass rounded-2xl p-1 mb-6 md:mb-8 flex gap-1 overflow-x-auto shadow-card">
              <button
                onClick={() => setActiveTab("followers")}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl text-sm md:text-base font-semibold transition-all ${
                  activeTab === "followers"
                    ? "bg-[var(--color-ios-blue)] text-white shadow-md"
                    : "text-[var(--color-secondary-text)] hover:bg-[var(--color-separator)]/30"
                }`}
              >
                <Users size={18} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">{t("followers")}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "followers"
                      ? "bg-white/20"
                      : "bg-[var(--color-separator)]/50"
                  }`}
                >
                  {followers.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 p-3 md:p-4 rounded-xl text-sm md:text-base font-semibold transition-all ${
                  activeTab === "following"
                    ? "bg-[var(--color-ios-blue)] text-white shadow-md"
                    : "text-[var(--color-secondary-text)] hover:bg-[var(--color-separator)]/30"
                }`}
              >
                <UserPlus size={18} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">{t("following")}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === "following"
                      ? "bg-white/20"
                      : "bg-[var(--color-separator)]/50"
                  }`}
                >
                  {following.length}
                </span>
              </button>
            </div>

            {activeTab === "followers" && (
              <div className="space-y-3">
                {followers.length === 0 ? (
                  <div className="glass rounded-3xl p-12 text-center shadow-card">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[var(--color-separator)]/30 flex items-center justify-center">
                      <Users
                        size={40}
                        className="text-[var(--color-tertiary-text)]"
                      />
                    </div>
                    <p className="text-[var(--color-secondary-text)] font-medium">
                      {t("no_followers_yet")}
                    </p>
                  </div>
                ) : (
                  followers.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => navigate(`/user/${f.follower.username}`)}
                      className="glass rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:shadow-card transition-all shadow-sm cursor-pointer"
                    >
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl icon-gradient p-[2px] shadow-md flex-shrink-0">
                        <div className="w-full h-full rounded-[14px] bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                          {f.follower.avatar ? (
                            <img
                              src={
                                f.follower.avatar.startsWith("http")
                                  ? f.follower.avatar
                                  : `${API_URL}${f.follower.avatar}`
                              }
                              alt={f.follower.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl md:text-2xl text-[var(--color-text)] font-bold">
                              {f.follower.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[var(--color-text)] text-base md:text-lg truncate">
                          {f.follower.username}
                        </h3>
                        {f.follower.nickname && (
                          <p className="text-sm text-[var(--color-ios-blue)] truncate">
                            @{f.follower.nickname}
                          </p>
                        )}
                        {f.follower.bio && (
                          <p className="text-xs md:text-sm text-[var(--color-secondary-text)] truncate mt-1">
                            {f.follower.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "following" && (
              <div className="space-y-3">
                {following.length === 0 ? (
                  <div className="glass rounded-3xl p-12 text-center shadow-card">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[var(--color-separator)]/30 flex items-center justify-center">
                      <UserPlus
                        size={40}
                        className="text-[var(--color-tertiary-text)]"
                      />
                    </div>
                    <p className="text-[var(--color-secondary-text)] font-medium">
                      {t("not_following_anyone_yet")}
                    </p>
                  </div>
                ) : (
                  following.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => navigate(`/user/${f.following.username}`)}
                      className="glass rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:shadow-card transition-all shadow-sm cursor-pointer"
                    >
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl icon-gradient p-[2px] shadow-md flex-shrink-0">
                        <div className="w-full h-full rounded-[14px] bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                          {f.following.avatar ? (
                            <img
                              src={
                                f.following.avatar.startsWith("http")
                                  ? f.following.avatar
                                  : `${API_URL}${f.following.avatar}`
                              }
                              alt={f.following.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl md:text-2xl text-[var(--color-text)] font-bold">
                              {f.following.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[var(--color-text)] text-base md:text-lg truncate">
                          {f.following.username}
                        </h3>
                        {f.following.nickname && (
                          <p className="text-sm text-[var(--color-ios-blue)] truncate">
                            @{f.following.nickname}
                          </p>
                        )}
                        {f.following.bio && (
                          <p className="text-xs md:text-sm text-[var(--color-secondary-text)] truncate mt-1">
                            {f.following.bio}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnfollow(f.following.id)}
                        className="btn-glass-danger text-sm whitespace-nowrap"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Profile;
