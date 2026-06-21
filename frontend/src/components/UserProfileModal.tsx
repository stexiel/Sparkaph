import React from "react";
import { X, User, Heart, Info } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { API_URL, APPS_URL, WS_URL } from '../config';
interface UserProfileModalProps {
  user: {
    username: string;
    avatar: string | null;
    bio?: string | null;
    relationshipStatus?: string | null;
    isOnline?: boolean;
    lastSeen?: string | null;
  };
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
}) => {
  const { t } = useLanguage();

  const getRelationshipStatusText = (status: string | null | undefined) => {
    switch (status) {
      case "single":
        return t("single");
      case "dating":
        return t("dating");
      case "married":
        return t("married");
      case "complicated":
        return t("complicated");
      case "searching":
        return t("searching");
      default:
        return t("not_specified");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="ios-glass-strong p-6 md:p-8 rounded-[32px] w-full max-w-md md:max-w-lg relative mx-4 md:mx-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-white/50 hover:text-white p-2"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#FF9500] to-[#007AFF] p-[3px] mb-4">
            <div className="w-full h-full rounded-full bg-[#1C1C1E] flex items-center justify-center overflow-hidden">
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
                <User size={40} className="text-white" />
              )}
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-1">
            {user.username}
          </h2>
        </div>

        <div className="space-y-4">
          <div className="ios-glass p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 text-[#007AFF]">
              <Info size={18} />
              <span className="font-semibold text-sm">{t("about_me")}</span>
            </div>
            <p className="text-sm text-white/80 whitespace-pre-wrap">
              {user.bio || t("not_specified")}
            </p>
          </div>

          <div className="ios-glass p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 text-[#FF9500]">
              <Heart size={18} />
              <span className="font-semibold text-sm">
                {t("relationship_status")}
              </span>
            </div>
            <p className="text-sm text-white/80">
              {getRelationshipStatusText(user.relationshipStatus)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
