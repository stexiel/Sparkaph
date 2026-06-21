import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import { API_URL } from '../config';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DeveloperAssistantProps {
  isInline?: boolean;
}

export default function DeveloperAssistant({ isInline = false }: DeveloperAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Привет! Я AI ассистент для разработчиков. Могу помочь тебе с вопросами по разработке, объяснить как использовать платформу, подсказать какие кнопки нажимать и т.д. Спрашивай!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ 
          message: `Ты - AI ассистент для разработчиков Sparkaph. Помогай пользователям с вопросами по разработке, объясняй как использовать платформу, подсказывай какие кнопки нажимать, как создавать приложения, как деплоить и т.д. Не генерируй код для приложений - для этого есть отдельный Sparkaph AI. Отвечай на русском языке кратко и по делу.

Пользователь: ${userMessage}` 
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
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

  if (isInline) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="Sparkaph AI" className="w-8 h-8" />
          <h3 className="font-semibold text-[var(--color-text)]">Developer AI</h3>
        </div>
        <div className="glass rounded-xl p-3 max-h-64 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-2 last:mb-0 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block px-3 py-2 rounded-lg text-sm ${
                  message.role === "user"
                    ? "bg-[var(--color-ios-orange)] text-white"
                    : "bg-[var(--color-tertiary-background)] text-[var(--color-text)]"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left">
              <div className="inline-block px-3 py-2 rounded-lg text-sm bg-[var(--color-tertiary-background)] text-[var(--color-text)]">
                <Loader2 size={14} className="animate-spin inline mr-2" />
                Пишу...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Задай вопрос..."
            className="input flex-1 text-sm py-2"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-glass-primary px-3 py-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
      <div className="glass-strong p-6 md:p-8 lg:p-12 rounded-[32px] w-full max-w-2xl md:max-w-3xl lg:max-w-4xl relative overflow-hidden">
        {/* Decorative gradient orb */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[var(--color-ios-orange)]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[var(--color-ios-pink)]/20 rounded-full blur-3xl"></div>

        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <img 
            src="/logo.png" 
            alt="Developer AI" 
            className="w-12 h-12 md:w-16 md:h-16 object-contain"
          />
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-text)]">
              Developer AI
            </h2>
            <p className="text-sm md:text-base text-[var(--color-tertiary-text)]">Ассистент для разработчиков</p>
          </div>
        </div>

        {/* Messages */}
        <div className="glass rounded-2xl p-4 md:p-6 mb-4 md:mb-6 max-h-[50vh] md:max-h-96 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 last:mb-0 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block max-w-2xl p-4 rounded-2xl ${
                  message.role === "user"
                    ? "btn-glass-primary"
                    : "glass"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={16} className="text-[var(--color-ios-orange)]" />
                    <span className="text-sm font-medium text-[var(--color-ios-orange)]">
                      Developer AI
                    </span>
                  </div>
                )}
                <p className="text-[var(--color-text)] whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block glass p-4 rounded-2xl flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[var(--color-ios-orange)]" />
                <span className="text-[var(--color-secondary-text)]">
                  Developer AI думает...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Задай вопрос по разработке..."
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="btn-primary px-8 py-4 text-lg"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
