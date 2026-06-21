import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Github, Chrome } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import CustomAlert from "../components/CustomAlert";
import { useAlert } from "../hooks/useAlert";
import { useLanguage } from "../context/LanguageContext";
import { API_URL, GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID, OAUTH_REDIRECT_URI } from '../config';
const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { alerts, showAlert, removeAlert } = useAlert();
  const { t, language, setLanguage } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/chat");
      } else {
        showAlert(data.message || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert("Failed to connect to server", "error");
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    const oauthUrls: Record<string, string> = {
      github:
        `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${OAUTH_REDIRECT_URI}/login/github/callback&scope=user:email`,
      google:
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${OAUTH_REDIRECT_URI}/login/google/callback&response_type=code&scope=email profile`,
    };

    window.location.href = oauthUrls[provider];
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
      <div className="glass-strong p-6 sm:p-8 rounded-3xl w-full max-w-[95vw] sm:max-w-md border border-[var(--color-separator)]/30 relative overflow-hidden shadow-elevated">
        {/* Decorative gradient orbs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-[var(--color-ios-blue)]/20 to-[var(--color-ios-indigo)]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-[var(--color-ios-purple)]/20 to-[var(--color-ios-pink)]/20 rounded-full blur-3xl"></div>

        {/* Theme toggle and language switcher in top right */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={() => setLanguage(language === "en" ? "ru" : "en")}
            className="p-2.5 glass rounded-xl hover:bg-[var(--color-separator)] transition-all flex items-center gap-2 px-3"
            title={language === "en" ? "Switch to Russian" : "Switch to English"}
          >
            <span className="text-lg">{language === "en" ? "🇬🇧" : "🇷🇺"}</span>
            <span className="text-xs font-semibold text-[var(--color-text)] hidden sm:inline">
              {language === "en" ? "EN" : "RU"}
            </span>
          </button>
          <ThemeToggle />
        </div>

        {/* Logo centered */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-ios-blue)] to-[var(--color-ios-indigo)] rounded-full blur-xl opacity-50"></div>
            <img
              src="/logo.png"
              alt="Sparkaph Logo"
              className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain"
            />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-[var(--color-text)]">
          Sparkaph
        </h2>
        <p className="text-center text-[var(--color-tertiary-text)] mb-6 text-sm">
          {t("welcome_back")}
        </p>

        {/* OAuth Buttons */}
        <div className="flex gap-3 mb-6 justify-center">
          <button
            onClick={() => handleOAuthLogin("github")}
            className="group relative p-3 sm:p-4 glass rounded-2xl hover:bg-[var(--color-separator)] transition-all flex items-center justify-center hover:scale-105 border border-[var(--color-separator)]/30"
            title="GitHub"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" className="relative w-6 h-6 sm:w-8 sm:h-8 dark:invert" />
          </button>
          <button
            onClick={() => handleOAuthLogin("google")}
            className="group relative p-3 sm:p-4 glass rounded-2xl hover:bg-[var(--color-separator)] transition-all flex items-center justify-center hover:scale-105 border border-[var(--color-separator)]/30"
            title="Google"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <img src="https://www.google.com/favicon.ico" alt="Google" className="relative w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-separator)]"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-3 sm:px-4 glass text-[var(--color-tertiary-text)]">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-text)] mb-2">
              {t("username")}
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tertiary-text)]"
                size={20}
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full pl-10 py-2.5 sm:py-3 text-sm border border-[var(--color-separator)]/30"
                placeholder={t("enter_username")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-secondary-text)] mb-2">
              {t("password")}
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tertiary-text)]"
                size={20}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full pl-10 py-2.5 sm:py-3 text-sm border border-[var(--color-separator)]/30"
                placeholder={t("enter_password")}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-2.5 sm:py-3 text-sm font-semibold">
            {t("sign_in")}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-[var(--color-tertiary-text)]">
          {t("dont_have_account")}{" "}
          <Link
            to="/register"
            className="text-[var(--color-ios-blue)] hover:text-[var(--color-ios-indigo)] font-semibold transition-colors"
          >
            {t("sign_up")}
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
