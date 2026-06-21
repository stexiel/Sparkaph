import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Globe, Code, Zap } from "lucide-react";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";

const SparkaphProfile = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      <Sidebar user={{ isDeveloper: false }} onLogout={handleLogout} />
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
              Sparkaph
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="w-full px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto">
            {/* Profile Header */}
            <div className="glass rounded-3xl p-6 md:p-8 mb-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-2xl icon-gradient p-[3px]">
                  <div className="w-full h-full rounded-xl bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                    <img
                      src="/logo.png"
                      alt="Sparkaph"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--color-text)] mb-2">
                    Sparkaph
                  </h2>
                  <p className="text-base md:text-lg text-[var(--color-ios-blue)] mb-4">
                    @sparkaph
                  </p>
                  <p className="text-sm md:text-base lg:text-lg text-[var(--color-secondary-text)] leading-relaxed mb-4">
                    Платформа для создания и размещения мини-приложений с современным дизайном и AI-ассистентом.
                  </p>
                  <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 glass rounded-xl">
                      <Globe size={16} className="text-[var(--color-ios-blue)]" />
                      <span className="text-xs md:text-sm text-[var(--color-text)]">Мини-аппы</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 glass rounded-xl">
                      <Code size={16} className="text-[var(--color-ios-orange)]" />
                      <span className="text-xs md:text-sm text-[var(--color-text)]">Для разработчиков</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 glass rounded-xl">
                      <Zap size={16} className="text-[var(--color-ios-purple)]" />
                      <span className="text-xs md:text-sm text-[var(--color-text)]">AI-ассистент</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-ios-blue)]/20 flex items-center justify-center">
                    <Globe size={20} className="text-[var(--color-ios-blue)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    Мини-приложения
                  </h3>
                </div>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Создавай и размещай адаптивные веб-приложения с красивым дизайном в стиле iOS.
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-ios-orange)]/20 flex items-center justify-center">
                    <Code size={20} className="text-[var(--color-ios-orange)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    Для разработчиков
                  </h3>
                </div>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Загружай ZIP файлы, используй мгновенный деплой и управляй API токенами.
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-ios-purple)]/20 flex items-center justify-center">
                    <Zap size={20} className="text-[var(--color-ios-purple)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    AI-ассистент
                  </h3>
                </div>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Генерируй мини-приложения с помощью Sparkaph AI одним запросом.
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-ios-green)]/20 flex items-center justify-center">
                    <Zap size={20} className="text-[var(--color-ios-green)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">
                    Мгновенный деплой
                  </h3>
                </div>
                <p className="text-sm text-[var(--color-secondary-text)]">
                  Размещай приложения мгновенно с помощью HTML кода или GitHub репозитория.
                </p>
              </div>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default SparkaphProfile;
