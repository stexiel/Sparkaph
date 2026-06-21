import { useState, useRef, useEffect } from "react";
import { Send, Bot, Download, Loader2, Rocket, X, Sparkles } from "lucide-react";
import { API_URL } from '../config';

interface Message {
  role: "user" | "assistant";
  content: string;
  zipUrl?: string;
  appUrl?: string;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Привет! Я Sparkaph AI - генератор мини-приложений. Опиши какой мини-апп тебе нужен, и я создам для тебя ZIP файл с готовым проектом! Или используй форму ниже для автоматического развертывания.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [appName, setAppName] = useState("");
  const [appHandle, setAppHandle] = useState("");
  const [deployMode, setDeployMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Check if user wants to create a mini-app
      const createAppKeywords = ["создай", "сделай", "генерируй", "создать", "сделать", "мини-апп", "приложение", "app"];
      const shouldCreateApp = createAppKeywords.some(keyword =>
        userMessage.toLowerCase().includes(keyword)
      );

      if (shouldCreateApp) {
        // Generate ZIP
        const response = await fetch(`${API_URL}/api/ai/generate-zip`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ description: userMessage }),
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Я создал для тебя мини-апп! Скачай ZIP файл и открой index.html в браузере.",
            zipUrl: `${API_URL}${data.zipUrl}`,
          },
        ]);
      } else {
        // Regular chat
        const response = await fetch(`${API_URL}/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ message: userMessage }),
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Произошла ошибка. Попробуй еще раз.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndDeploy = async () => {
    if (!input.trim() || !appName.trim() || !appHandle.trim()) {
      alert("Заполните все поля: описание, название и handle приложения");
      return;
    }

    const userMessage = input;
    setInput("");
    setAppName("");
    setAppHandle("");
    setMessages((prev) => [...prev, { role: "user", content: `Создай и разверни приложение: ${appName} (@${appHandle})\n\n${userMessage}` }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/generate-and-deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          description: userMessage,
          appName: appName,
          handle: appHandle,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Приложение "${appName}" создано и развертывается! URL: ${window.location.origin}/${appHandle}`,
          appUrl: `${window.location.origin}/${appHandle}`,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Произошла ошибка при создании и развертывании. Попробуй еще раз.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = (zipUrl: string) => {
    window.open(zipUrl, "_blank");
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="glass-strong border-b border-[var(--color-separator)] px-4 py-3 flex items-center gap-3">
        <div className="relative">
          <img
            src="/logo-ai-sparkaph.png"
            alt="Sparkaph AI"
            className="w-10 h-10 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/logo.png";
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--color-ios-green)] rounded-full border-2 border-[var(--color-background)]" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
            Sparkaph AI
            <Sparkles size={16} className="text-[var(--color-ios-blue)]" />
          </h2>
          <p className="text-xs text-[var(--color-ios-green)]">Онлайн</p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-[var(--color-separator)]/50 rounded-xl transition-colors"
        >
          <X size={20} className="text-[var(--color-tertiary-text)]" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full icon-gradient p-[2px] flex-shrink-0">
                <div className="w-full h-full rounded-full bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo-ai-sparkaph.png"
                    alt="Sparkaph AI"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/logo.png";
                    }}
                  />
                </div>
              </div>
            )}
            <div
              className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl ${
                message.role === "user"
                  ? "btn-glass-primary"
                  : "glass"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[var(--color-ios-blue)]">
                    Sparkaph AI
                  </span>
                </div>
              )}
              <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
              {message.zipUrl && (
                <button
                  onClick={() => handleDownloadZip(message.zipUrl!)}
                  className="mt-3 btn-glass-secondary flex items-center gap-2 text-sm py-2 px-4"
                >
                  <Download size={16} />
                  Скачать ZIP
                </button>
              )}
              {message.appUrl && (
                <button
                  onClick={() => window.open(message.appUrl!, "_blank")}
                  className="mt-3 btn-glass-primary flex items-center gap-2 text-sm py-2 px-4"
                >
                  <Rocket size={16} />
                  Открыть приложение
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full icon-gradient p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-[var(--color-tertiary-background)] flex items-center justify-center overflow-hidden">
                <img
                  src="/logo-ai-sparkaph.png"
                  alt="Sparkaph AI"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/logo.png";
                  }}
                />
              </div>
            </div>
            <div className="glass p-4 rounded-2xl flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[var(--color-ios-blue)]" />
              <span className="text-sm text-[var(--color-secondary-text)]">
                Sparkaph AI думает...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-[var(--color-separator)] p-4 space-y-3">
        {deployMode && (
          <div className="space-y-2">
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Название приложения"
              className="input w-full text-sm"
              disabled={loading}
            />
            <input
              type="text"
              value={appHandle}
              onChange={(e) => setAppHandle(e.target.value)}
              placeholder="Handle (например: myapp)"
              className="input w-full text-sm"
              disabled={loading}
            />
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (deployMode ? handleGenerateAndDeploy() : handleSend())}
            placeholder={deployMode ? "Опиши какой мини-апп тебе нужен..." : "Опиши какой мини-апп тебе нужен..."}
            className="input flex-1 text-sm"
            disabled={loading}
          />
          <button
            onClick={() => setDeployMode(!deployMode)}
            className={`p-3 rounded-xl transition-all ${
              deployMode ? "btn-glass-primary" : "btn-glass-secondary"
            }`}
            disabled={loading}
            title={deployMode ? "Режим чата" : "Режим развертывания"}
          >
            <Rocket size={18} />
          </button>
          <button
            onClick={deployMode ? handleGenerateAndDeploy : handleSend}
            disabled={loading || !input.trim() || (deployMode && (!appName.trim() || !appHandle.trim()))}
            className="btn-primary p-3 rounded-xl"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
