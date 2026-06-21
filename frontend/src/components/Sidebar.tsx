import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, User, Code, LogOut, ChevronLeft, ChevronRight, Globe, ChevronDown, Wallet, Grid3x3 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Notifications from "./Notifications";
import { useLanguage } from "../context/LanguageContext";

interface SidebarProps {
  user: any;
  onLogout: () => void;
  isMessengerCollapsed?: boolean;
  setIsMessengerCollapsed?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isMessengerCollapsed = false, setIsMessengerCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="hidden md:flex w-20 glass-strong border-r border-[var(--color-separator)] flex-col items-center py-4 gap-4">
      {/* Logo */}
      <button
        onClick={() => navigate("/profile/sparkaph")}
        className="mb-4"
      >
        <img 
          src="/logo.png" 
          alt="Sparkaph Logo" 
          className="w-12 h-12 object-contain"
        />
      </button>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-2">
        <button
          onClick={() => navigate("/chat")}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all backdrop-blur-[60px] saturate-[180%] border-2 ${
            isActive("/chat")
              ? "bg-[var(--color-ios-blue)]/30 border-[var(--color-ios-blue)]/50 text-[var(--color-ios-blue)] shadow-[0_8px_32px_rgba(0,122,255,0.3)]"
              : "bg-[var(--color-glass-button)] border-[var(--color-glass-border)] text-[var(--color-tertiary-text)] hover:bg-[var(--color-glass-button-hover)] hover:text-[var(--color-text)] hover:border-[var(--color-separator)]"
          }`}
          title={t("chats")}
        >
          <MessageCircle size={24} />
        </button>

        <button
          onClick={() => navigate("/profile")}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all backdrop-blur-[60px] saturate-[180%] border-2 ${
            isActive("/profile")
              ? "bg-[var(--color-ios-blue)]/30 border-[var(--color-ios-blue)]/50 text-[var(--color-ios-blue)] shadow-[0_8px_32px_rgba(0,122,255,0.3)]"
              : "bg-[var(--color-glass-button)] border-[var(--color-glass-border)] text-[var(--color-tertiary-text)] hover:bg-[var(--color-glass-button-hover)] hover:text-[var(--color-text)] hover:border-[var(--color-separator)]"
          }`}
          title={t("profile")}
        >
          <User size={24} />
        </button>

        <button
          onClick={() => navigate("/wallet")}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all backdrop-blur-[60px] saturate-[180%] border-2 ${
            isActive("/wallet")
              ? "bg-[var(--color-ios-yellow)]/30 border-[var(--color-ios-yellow)]/50 text-[var(--color-ios-yellow)] shadow-[0_8px_32px_rgba(255,204,0,0.3)]"
              : "bg-[var(--color-glass-button)] border-[var(--color-glass-border)] text-[var(--color-tertiary-text)] hover:bg-[var(--color-glass-button-hover)] hover:text-[var(--color-text)] hover:border-[var(--color-separator)]"
          }`}
          title="Sparks Wallet"
        >
          <Wallet size={24} />
        </button>

        <button
          onClick={() => navigate("/apps")}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all backdrop-blur-[60px] saturate-[180%] border-2 ${
            isActive("/apps")
              ? "bg-[var(--color-ios-purple)]/30 border-[var(--color-ios-purple)]/50 text-[var(--color-ios-purple)] shadow-[0_8px_32px_rgba(175,82,222,0.3)]"
              : "bg-[var(--color-glass-button)] border-[var(--color-glass-border)] text-[var(--color-tertiary-text)] hover:bg-[var(--color-glass-button-hover)] hover:text-[var(--color-text)] hover:border-[var(--color-separator)]"
          }`}
          title="Mini-Apps"
        >
          <Grid3x3 size={24} />
        </button>

        {user?.isDeveloper && (
          <button
            onClick={() => navigate("/developer")}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all backdrop-blur-[60px] saturate-[180%] border-2 ${
              isActive("/developer")
                ? "bg-[var(--color-ios-orange)]/30 border-[var(--color-ios-orange)]/50 text-[var(--color-ios-orange)] shadow-[0_8px_32px_rgba(255,149,0,0.3)]"
                : "bg-[var(--color-glass-button)] border-[var(--color-glass-border)] text-[var(--color-tertiary-text)] hover:bg-[var(--color-glass-button-hover)] hover:text-[var(--color-text)] hover:border-[var(--color-separator)]"
            }`}
            title={t("developer_dashboard")}
          >
            <Code size={24} />
          </button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2">
        <Notifications />
        {setIsMessengerCollapsed && (
          <button
            onClick={() => setIsMessengerCollapsed(!isMessengerCollapsed)}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] transition-all backdrop-blur-[60px] saturate-[180%] bg-[var(--color-glass-button)] border-2 border-[var(--color-glass-border)] hover:bg-[var(--color-glass-button-hover)] hover:border-[var(--color-separator)]"
            title={isMessengerCollapsed ? "Развернуть мессенджер" : "Свернуть мессенджер"}
          >
            {isMessengerCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] transition-all backdrop-blur-[60px] saturate-[180%] bg-[var(--color-glass-button)] border-2 border-[var(--color-glass-border)] hover:bg-[var(--color-glass-button-hover)] hover:border-[var(--color-separator)]"
            title={t("select_language")}
          >
            <Globe size={20} />
          </button>
          {showLanguageDropdown && (
            <div className="absolute bottom-full left-0 mb-2 glass-strong rounded-xl border border-[var(--color-separator)] overflow-hidden shadow-elevated">
              <button
                onClick={() => {
                  setLanguage("en");
                  setShowLanguageDropdown(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  language === "en" 
                    ? "bg-[var(--color-ios-blue)]/20 text-[var(--color-ios-blue)]" 
                    : "text-[var(--color-text)] hover:bg-[var(--color-separator)]"
                }`}
              >
                🇬🇧 {t("english")}
              </button>
              <button
                onClick={() => {
                  setLanguage("ru");
                  setShowLanguageDropdown(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  language === "ru" 
                    ? "bg-[var(--color-ios-blue)]/20 text-[var(--color-ios-blue)]" 
                    : "text-[var(--color-text)] hover:bg-[var(--color-separator)]"
                }`}
              >
                🇷🇺 {t("russian")}
              </button>
            </div>
          )}
        </div>
        <ThemeToggle />
        <button
          onClick={onLogout}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-red)] transition-all backdrop-blur-[60px] saturate-[180%] bg-[var(--color-glass-button)] border-2 border-[var(--color-glass-border)] hover:bg-[var(--color-ios-red)]/20 hover:border-[var(--color-ios-red)]/40"
          title={t("logout")}
        >
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
