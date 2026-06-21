import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, User, Code, Settings, Wallet } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isDeveloper = user.isDeveloper;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-[var(--color-separator)] safe-area-bottom backdrop-blur-[60px] saturate-[180%]">
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => navigate("/chat")}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all backdrop-blur-[60px] saturate-[180%] ${
            isActive("/chat")
              ? "text-[var(--color-ios-blue)] bg-[var(--color-ios-blue)]/10 border border-[var(--color-ios-blue)]/30"
              : "text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] hover:bg-[var(--color-glass-button)]"
          }`}
        >
          <MessageCircle
            size={24}
            className={isActive("/chat") ? "fill-current" : ""}
          />
          <span className="text-xs font-medium">{t("chats")}</span>
        </button>

        <button
          onClick={() => navigate("/wallet")}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all backdrop-blur-[60px] saturate-[180%] ${
            isActive("/wallet")
              ? "text-[var(--color-ios-yellow)] bg-[var(--color-ios-yellow)]/10 border border-[var(--color-ios-yellow)]/30"
              : "text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] hover:bg-[var(--color-glass-button)]"
          }`}
        >
          <Wallet
            size={24}
            className={isActive("/wallet") ? "fill-current" : ""}
          />
          <span className="text-xs font-medium">Wallet</span>
        </button>

        {isDeveloper && (
          <button
            onClick={() => navigate("/developer")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all backdrop-blur-[60px] saturate-[180%] ${
              isActive("/developer")
                ? "text-[var(--color-ios-orange)] bg-[var(--color-ios-orange)]/10 border border-[var(--color-ios-orange)]/30"
                : "text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] hover:bg-[var(--color-glass-button)]"
            }`}
          >
            <Code
              size={24}
              className={isActive("/developer") ? "fill-current" : ""}
            />
            <span className="text-xs font-medium">{t("dev")}</span>
          </button>
        )}

        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all backdrop-blur-[60px] saturate-[180%] ${
            isActive("/profile")
              ? "text-[var(--color-ios-blue)] bg-[var(--color-ios-blue)]/10 border border-[var(--color-ios-blue)]/30"
              : "text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] hover:bg-[var(--color-glass-button)]"
          }`}
        >
          <User
            size={24}
            className={isActive("/profile") ? "fill-current" : ""}
          />
          <span className="text-xs font-medium">{t("profile")}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
