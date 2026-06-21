import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Heart,
  UserPlus,
  UserMinus,
  MessageCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ToastContainer";
import { API_URL, APPS_URL, WS_URL } from '../config';
const PublicProfile: React.FC = () => {
  const params = useParams<{ username?: string; handle?: string }>();
  const username = params.username || params.handle;
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toasts, success, error, removeToast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutualFollow, setIsMutualFollow] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/user/${username}`, {
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
          setUser(data);
          // Check if following
          const followingRes = await fetch(
            `${API_URL}/api/followers/following`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const followingData = await followingRes.json();
          setIsFollowing(
            followingData.some((f: any) => f.following.id === data.id),
          );

          // Check if mutual follow (friends)
          const followersRes = await fetch(
            `${API_URL}/api/followers/user/${data.id}/followers`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const followersData = await followersRes.json();
          setIsMutualFollow(
            followersData.some((f: any) => f.follower.id === currentUser.id) && isFollowing
          );
        } else {
          navigate("/chat");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        navigate("/chat");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/followers/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });
      if (response.ok) {
        setIsFollowing(true);
        success(t("following_user"));
        // Update user data to reflect new follower count
        if (user) {
          setUser({ ...user, followersCount: (user.followersCount || 0) + 1 });
        }
      }
    } catch (err) {
      console.error("Error following user:", err);
      error(t("failed_to_follow_user"));
    }
  };

  const handleUnfollow = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/followers/unfollow/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setIsFollowing(false);
        success(t("unfollowed_user"));
        // Update user data to reflect new follower count
        if (user) {
          setUser({ ...user, followersCount: Math.max((user.followersCount || 0) - 1, 0) });
        }
      }
    } catch (err) {
      console.error("Error unfollowing user:", err);
      error(t("failed_to_unfollow_user"));
    }
  };


  const getRelationshipStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      single: t("single"),
      dating: t("dating"),
      married: t("married"),
      complicated: t("complicated"),
      searching: t("searching"),
      not_specified: t("not_specified"),
    };
    return statusMap[status] || t("not_specified");
  };

  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/followers/user/${user.id}/followers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFollowers(data);
      setShowFollowers(true);
    } catch (err) {
      console.error("Error fetching followers:", err);
      error(t("failed_to_fetch_followers"));
    }
  };

  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/followers/user/${user.id}/following`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFollowing(data);
      setShowFollowing(true);
    } catch (err) {
      console.error("Error fetching following:", err);
      error(t("failed_to_fetch_following"));
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen bg-[var(--color-background)] items-center justify-center">
        <div className="glass rounded-3xl p-8">
          <div className="animate-pulse text-[var(--color-text)] font-medium">
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (!user || !currentUser) {
    return null;
  }

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
                {user.username}
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
            <div className="w-full">
              {/* Telegram-style Profile Header */}
              <div className="relative">
                {/* Cover Photo */}
                <div className="h-48 md:h-64 bg-gradient-to-br from-[var(--color-ios-blue)] to-[var(--color-ios-indigo)]"></div>
                
                {/* Profile Picture */}
                <div className="absolute -bottom-16 left-4 md:left-8">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full icon-gradient p-[3px] shadow-2xl bg-[var(--color-background)]">
                    <div className="w-full h-full rounded-full bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                      {user.siteAvatar ? (
                        <img
                          src={
                            user.siteAvatar.startsWith("http")
                              ? user.siteAvatar
                              : `${API_URL}${user.siteAvatar}`
                          }
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : user.avatar ? (
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
                        <span className="text-5xl md:text-6xl text-[var(--color-text)] font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Online Status */}
                <div className="absolute -bottom-12 left-40 md:left-52">
                  {user.isOnline && (
                    <div className="w-4 h-4 bg-[var(--color-ios-green)] rounded-full border-4 border-[var(--color-background)]"></div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="px-4 md:px-8 pt-20 pb-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-1">
                      {user.username}
                    </h1>
                    {user.nickname && (
                      <p className="text-base md:text-lg text-[var(--color-ios-blue)] mb-2">
                        @{user.nickname}
                      </p>
                    )}
                    <p className="text-sm md:text-base text-[var(--color-secondary-text)] leading-relaxed mb-4">
                      {user.bio || t("no_bio_yet")}
                    </p>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      {isMutualFollow && (
                        <span className="px-3 py-1 bg-gradient-to-br from-[var(--color-ios-green)] to-[var(--color-ios-teal)] text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md">
                          <Shield size={14} />
                          {t("friend")}
                        </span>
                      )}
                      {isFollowing && !isMutualFollow && (
                        <span className="px-3 py-1 bg-[var(--color-ios-blue)]/20 text-[var(--color-ios-blue)] text-xs font-bold rounded-full">
                          {t("following")}
                        </span>
                      )}
                      {user.isOnline && (
                        <span className="px-3 py-1 bg-[var(--color-ios-green)]/20 text-[var(--color-ios-green)] text-xs font-bold rounded-full">
                          {t("online_status")}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6">
                      <button
                        onClick={fetchFollowers}
                        className="text-center hover:opacity-80 transition-opacity"
                      >
                        <p className="text-xl font-bold text-[var(--color-text)]">
                          {user.followersCount || 0}
                        </p>
                        <p className="text-xs text-[var(--color-tertiary-text)]">{t("followers")}</p>
                      </button>
                      <button
                        onClick={fetchFollowing}
                        className="text-center hover:opacity-80 transition-opacity"
                      >
                        <p className="text-xl font-bold text-[var(--color-text)]">
                          {user.followingCount || 0}
                        </p>
                        <p className="text-xs text-[var(--color-tertiary-text)]">{t("following")}</p>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/chat?userId=${user.id}`)}
                      className="btn-glass-primary flex items-center justify-center gap-2 px-6 py-3"
                    >
                      <MessageCircle size={20} />
                      <span>{t("message")}</span>
                    </button>
                    {isFollowing ? (
                      <button
                        onClick={handleUnfollow}
                        className="glass rounded-2xl font-semibold hover:shadow-card transition-all flex items-center justify-center gap-2 text-[var(--color-text)] px-6 py-3"
                      >
                        <UserMinus size={20} />
                        <span className="hidden sm:inline">{t("unfollow")}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleFollow}
                        className="glass rounded-2xl font-semibold hover:shadow-card transition-all flex items-center justify-center gap-2 text-[var(--color-text)] px-6 py-3"
                      >
                        <UserPlus size={20} />
                        <span className="hidden sm:inline">{t("follow")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {user.relationshipStatus &&
                  user.relationshipStatus !== "not_specified" && (
                    <div className="mt-6 glass rounded-2xl p-4 shadow-card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-ios-pink)]/20 flex items-center justify-center">
                          <Heart
                            size={20}
                            className="text-[var(--color-ios-pink)]"
                          />
                        </div>
                        <div>
                          <h3 className="text-sm text-[var(--color-tertiary-text)]">
                            Relationship Status
                          </h3>
                          <p className="text-base font-semibold text-[var(--color-text)]">
                            {getRelationshipStatusText(user.relationshipStatus)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

          <BottomNav />
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowFollowers(false)}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--color-text)]">{t("followers")}</h2>
              <button onClick={() => setShowFollowers(false)} className="text-[var(--color-tertiary-text)] hover:text-[var(--color-text)]">
                ✕
              </button>
            </div>
            {followers.length === 0 ? (
              <p className="text-center text-[var(--color-tertiary-text)] py-8">{t("no_followers_yet")}</p>
            ) : (
              <div className="space-y-3">
                {followers.map((f: any) => (
                  <div
                    key={f.follower.id}
                    onClick={() => {
                      navigate(`/user/${f.follower.username}`);
                      setShowFollowers(false);
                    }}
                    className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-[var(--color-separator)] cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full icon-gradient p-[2px]">
                      <div className="w-full h-full rounded-full bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                        {f.follower.avatar ? (
                          <img
                            src={f.follower.avatar.startsWith("http") ? f.follower.avatar : `${API_URL}${f.follower.avatar}`}
                            alt={f.follower.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-[var(--color-text)] font-bold">
                            {f.follower.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{f.follower.username}</p>
                      {f.follower.bio && (
                        <p className="text-xs text-[var(--color-tertiary-text)] truncate">{f.follower.bio}</p>
                      )}
                    </div>
                    {f.follower.isOnline && (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-ios-green)]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowFollowing(false)}>
          <div className="glass-strong rounded-3xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--color-text)]">{t("following")}</h2>
              <button onClick={() => setShowFollowing(false)} className="text-[var(--color-tertiary-text)] hover:text-[var(--color-text)]">
                ✕
              </button>
            </div>
            {following.length === 0 ? (
              <p className="text-center text-[var(--color-tertiary-text)] py-8">{t("not_following_anyone_yet")}</p>
            ) : (
              <div className="space-y-3">
                {following.map((f: any) => (
                  <div
                    key={f.following.id}
                    onClick={() => {
                      navigate(`/user/${f.following.username}`);
                      setShowFollowing(false);
                    }}
                    className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-[var(--color-separator)] cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full icon-gradient p-[2px]">
                      <div className="w-full h-full rounded-full bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                        {f.following.avatar ? (
                          <img
                            src={f.following.avatar.startsWith("http") ? f.following.avatar : `${API_URL}${f.following.avatar}`}
                            alt={f.following.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-[var(--color-text)] font-bold">
                            {f.following.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--color-text)]">{f.following.username}</p>
                      {f.following.bio && (
                        <p className="text-xs text-[var(--color-tertiary-text)] truncate">{f.following.bio}</p>
                      )}
                    </div>
                    {f.following.isOnline && (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-ios-green)]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

export default PublicProfile;
