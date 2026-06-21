import React, { useState, useRef } from "react";
import {
  X,
  Save,
  Upload,
  User,
  Globe,
  Code,
  Bell,
  BellOff,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../hooks/useToast";
import ToastContainer from "./ToastContainer";
import { API_URL, APPS_URL, WS_URL } from '../config';
interface ProfileSettingsProps {
  user: any;
  onClose: () => void;
  onUpdate: (user: any) => void;
  isPage?: boolean;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  user,
  onClose,
  onUpdate,
  isPage = false,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { toasts, success, error, info, removeToast } = useToast();
  const [username, setUsername] = useState(user.username);
  const [nickname, setNickname] = useState(user.nickname || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [siteAvatar, setSiteAvatar] = useState(user.siteAvatar || "");
  const [bio, setBio] = useState(user.bio || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user.notificationsEnabled ?? true,
  );
  const [isDeveloper, setIsDeveloper] = useState(user.isDeveloper || false);
  const [tempLanguage, setTempLanguage] = useState(language);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameReason, setUsernameReason] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const siteAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      setAvatar(data.url);
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  const handleSiteAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      setSiteAvatar(data.url);
    } catch (error) {
      console.error("Error uploading site avatar:", error);
    }
  };

  const handleRemoveSiteAvatar = () => {
    setSiteAvatar("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          nickname,
          avatar,
          siteAvatar,
          bio,
          notificationsEnabled,
          isDeveloper,
        }),
      });
      const updatedUser = await response.json();
      
      // Apply language change only after save
      setLanguage(tempLanguage);
      
      // Update user in localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onUpdate(updatedUser);
      success("Profile updated successfully!");
      if (!isPage) {
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      error("Failed to update profile. Please try again.");
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      info(t("browser_not_supported"));
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
    }
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleToggleDeveloperMode = () => {
    setIsDeveloper(!isDeveloper);
  };

  const checkUsernameAvailability = async (newUsername: string) => {
    if (!newUsername || newUsername.length < 3) {
      setUsernameAvailable(null);
      setUsernameReason(null);
      return;
    }
    if (newUsername === user.username) {
      setUsernameAvailable(true);
      setUsernameReason(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const response = await fetch(`${API_URL}/api/users/check-username?username=${newUsername}`);
      const data = await response.json();
      setUsernameAvailable(data.available);
      setUsernameReason(data.reason || null);
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameAvailable(null);
      setUsernameReason(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const content = (
    <div
      className={`w-full ${!isPage ? "glass-strong p-4 md:p-8 rounded-3xl max-w-md relative max-h-[90vh] overflow-y-auto mx-4 md:mx-0" : ""}`}
    >
      {!isPage && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] p-2"
        >
          <X size={20} />
        </button>
      )}

      {isPage && (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl icon-gradient p-[2px]">
            <div className="w-full h-full rounded-lg bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden relative">
              {avatar ? (
                <img
                  src={
                    avatar.startsWith("http")
                      ? avatar
                      : `${API_URL}${avatar}`
                  }
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User
                  size={24}
                  className="text-[var(--color-text)] md:w-8 md:h-8"
                />
              )}
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-lg md:text-xl font-bold text-[var(--color-text)]">
              {t("profile_settings")}
            </h2>
            <p className="text-xs md:text-sm text-[var(--color-tertiary-text)]">
              {t("update_profile")}
            </p>
          </div>
        </div>
      )}

      {!isPage && (
        <div className="flex flex-col items-center mb-8">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-32 h-32 rounded-2xl icon-gradient p-[3px]">
              <div className="w-full h-full rounded-xl bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden relative">
                {avatar ? (
                  <img
                    src={
                      avatar.startsWith("http")
                        ? avatar
                        : `${API_URL}${avatar}`
                    }
                    alt={username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-[var(--color-text)]" />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                  <Upload size={32} className="text-white" />
                </div>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <p className="text-sm text-[var(--color-tertiary-text)] mt-3">
            {t("click_change_avatar")}
          </p>
        </div>
      )}

      {/* Site Avatar Section */}
      <div className="mb-6 p-4 glass rounded-2xl">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">{t("site_avatar")}</h3>
        <div className="flex items-center gap-4">
          <div
            className="relative group cursor-pointer w-16 h-16 rounded-xl icon-gradient p-[2px]"
            onClick={() => siteAvatarInputRef.current?.click()}
          >
            <div className="w-full h-full rounded-lg bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden relative">
              {siteAvatar ? (
                <img
                  src={
                    siteAvatar.startsWith("http")
                      ? siteAvatar
                      : `${API_URL}${siteAvatar}`
                  }
                  alt="Site Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Globe size={24} className="text-[var(--color-text)]" />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <Upload size={20} className="text-white" />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <input
              type="file"
              ref={siteAvatarInputRef}
              onChange={handleSiteAvatarChange}
              accept="image/*"
              className="hidden"
            />
            {siteAvatar && (
              <button
                type="button"
                onClick={handleRemoveSiteAvatar}
                className="text-xs text-[var(--color-ios-red)] hover:underline"
              >
                {t("remove")}
              </button>
            )}
          </div>
        </div>
      </div>

      {isPage && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={siteAvatarInputRef}
            onChange={handleSiteAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </>
      )}

      <form
        onSubmit={handleSubmit}
        className={`${isPage ? "space-y-4 md:space-y-6" : "space-y-4 md:space-y-5"}`}
      >
        <div>
          <label className="block text-xs md:text-sm font-medium text-[var(--color-secondary-text)] mb-2">
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                checkUsernameAvailability(e.target.value);
              }}
              className={`input w-full text-sm md:text-base ${usernameAvailable === false ? 'border-red-500 focus:border-red-500' : usernameAvailable === true ? 'border-green-500 focus:border-green-500' : ''}`}
            />
            {checkingUsername && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[var(--color-ios-blue)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {usernameAvailable === false && (
              <p className="text-xs text-red-500 mt-1">{usernameReason || "Username already taken"}</p>
            )}
            {usernameAvailable === true && (
              <p className="text-xs text-green-500 mt-1">Username available</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-[var(--color-secondary-text)] mb-2">
            Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="input w-full text-sm md:text-base"
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-[var(--color-secondary-text)] mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input w-full h-20 md:h-24 resize-none text-sm md:text-base"
            placeholder="Tell us about yourself"
          />
        </div>

        <div
          className={`${isPage ? "glass rounded-2xl p-4 md:p-5 shadow-card" : "glass rounded-2xl p-3 md:p-4"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${
                  notificationsEnabled
                    ? "bg-[var(--color-ios-blue)]/20"
                    : "bg-[var(--color-separator)]/30"
                }`}
              >
                {notificationsEnabled ? (
                  <Bell
                    size={20}
                    className="text-[var(--color-ios-blue)] md:w-6 md:h-6"
                  />
                ) : (
                  <BellOff
                    size={20}
                    className="text-[var(--color-tertiary-text)] md:w-6 md:h-6"
                  />
                )}
              </div>
              <div>
                <span className="text-sm md:text-base font-semibold text-[var(--color-text)] block">
                  Notifications
                </span>
                <p className="text-xs md:text-sm text-[var(--color-tertiary-text)]">
                  {t("in_app_notifications")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleNotifications}
              className={`w-14 h-8 rounded-full relative transition-all ${notificationsEnabled ? "bg-[var(--color-ios-blue)] shadow-md" : "bg-[var(--color-separator)]"}`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${notificationsEnabled ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
        </div>

        <div
          className={`${isPage ? "glass rounded-2xl p-4 md:p-5 shadow-card" : "glass rounded-2xl p-3 md:p-4"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[var(--color-ios-indigo)]/20 flex items-center justify-center">
                <Globe
                  size={20}
                  className="text-[var(--color-ios-indigo)] md:w-6 md:h-6"
                />
              </div>
              <div>
                <span className="text-sm md:text-base font-semibold text-[var(--color-text)] block">
                  Language
                </span>
                <p className="text-xs md:text-sm text-[var(--color-tertiary-text)]">
                  Select your language
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setTempLanguage(tempLanguage === "en" ? "ru" : "en");
              }}
              className="px-4 md:px-5 py-2 md:py-2.5 glass rounded-xl font-semibold text-[var(--color-text)] hover:shadow-md transition-all whitespace-nowrap"
            >
              {tempLanguage === "en" ? "🇬🇧 EN" : "🇷🇺 RU"}
            </button>
          </div>
        </div>

        <div
          className={`${isPage ? "glass rounded-2xl p-4 md:p-5 shadow-card border-l-4 border-l-[var(--color-ios-orange)]" : "glass rounded-2xl p-3 md:p-4 border-l-4 border-l-[var(--color-ios-orange)]"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${
                  isDeveloper
                    ? "bg-gradient-to-br from-[var(--color-ios-orange)] to-[var(--color-ios-pink)] shadow-md"
                    : "bg-[var(--color-separator)]/30"
                }`}
              >
                <Code
                  size={20}
                  className={`${isDeveloper ? "text-white" : "text-[var(--color-tertiary-text)]"} md:w-6 md:h-6`}
                />
              </div>
              <div>
                <span className="text-sm md:text-base font-semibold text-[var(--color-text)] block">
                  Developer Mode
                </span>
                <p className="text-xs md:text-sm text-[var(--color-tertiary-text)]">
                  {t("access_developer_console")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleDeveloperMode}
              className={`w-14 h-8 rounded-full relative transition-all ${isDeveloper ? "bg-[var(--color-ios-orange)] shadow-md" : "bg-[var(--color-separator)]"}`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${isDeveloper ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 md:py-4 text-base md:text-lg font-semibold flex items-center justify-center gap-2"
        >
          <Save size={18} className="md:w-5 md:h-5" />
          {t("save_changes")}
        </button>
      </form>
    </div>
  );

  if (isPage) {
    return (
      <>
        {content}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

export default ProfileSettings;
