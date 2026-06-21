import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, AlertCircle, Upload } from "lucide-react";
import { API_URL, APPS_URL, WS_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
interface App {
  id: string;
  name: string;
  handle: string;
  description: string;
  type: string;
  status: string;
  url?: string;
  user: {
    username: string;
    avatar: string;
  };
  deployments: Deployment[];
}

interface Deployment {
  id: string;
  status: string;
  url: string;
}

const AppViewer: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (handle) {
      fetchApp();
    }
  }, [handle]);

  const fetchApp = async () => {
    try {
      const response = await fetch(`${API_URL}/app/${handle}`);

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setApp(data);
      } else if (response.status === 404) {
        setError("App not found");
      } else {
        setError("Failed to load app");
      }
    } catch (err) {
      setError("Failed to load app");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-ios-blue)] to-[var(--color-ios-purple)] flex items-center justify-center">
            <Loader size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
            {t("loading_app")}
          </h2>
          <p className="text-[var(--color-secondary-text)]">
            {t("please_wait")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-ios-red)] to-[var(--color-ios-pink)] flex items-center justify-center">
            <AlertCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">App Not Found</h1>
          <p className="text-[var(--color-secondary-text)] mb-6">
            {error ||
              "The app you are looking for does not exist or is not available."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn-glass-primary w-full"
          >
            Go to Sparkaph
          </button>
        </div>
      </div>
    );
  }

  const latestDeployment = app.deployments.find((d) => d.status === "DEPLOYED");
  const pendingDeployment = app.deployments.find((d) => d.status === "PENDING");

  if (!latestDeployment && pendingDeployment) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-ios-orange)] to-[var(--color-ios-pink)] flex items-center justify-center">
            <Upload size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            {t("waiting_for_upload")}
          </h1>
          <p className="text-[var(--color-secondary-text)] mb-6">
            {t("app_ready_needs_zip")}
          </p>
          <button
            onClick={() => navigate("/developer")}
            className="btn-glass-primary w-full"
          >
            {t("go_to_developer_console")}
          </button>
        </div>
      </div>
    );
  }

  if (!latestDeployment) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-ios-indigo)] to-[var(--color-ios-purple)] flex items-center justify-center">
            <AlertCircle size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            App Not Deployed
          </h1>
          <p className="text-[var(--color-secondary-text)] mb-6">
            This app has been created but has no active deployment yet.
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn-glass w-full"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // HOSTED app - show in iframe
  if (app.type === "HOSTED" && latestDeployment) {
    const appUrl = `${API_URL}/apps/${app.handle}`;

    return (
      <div className="h-screen w-full">
        <iframe
          src={appUrl}
          title={app.name}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    );
  }

  // EXTERNAL app - show in iframe if URL is provided
  if (app.type === "EXTERNAL") {
    // For EXTERNAL apps, you need to provide the URL manually
    const externalUrl = latestDeployment?.url || app.url;

    return (
      <div className="h-screen w-full">
        <iframe
          src={externalUrl}
          title={app.name}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>
    );
  }

  // Fallback - show app info page
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{app.name}</h1>
        <p className="text-white/50 mb-4">@{app.handle}</p>
        <p className="text-white/70 mb-6">{app.description}</p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <img
            src={app.user.avatar || "/default-avatar.png"}
            alt={app.user.username}
            className="w-10 h-10 rounded-full"
          />
          <span className="text-white/70">by @{app.user.username}</span>
        </div>
        {latestDeployment?.url && (
          <a
            href={latestDeployment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pixel-btn inline-block px-6 py-2 rounded-lg"
          >
            Open App
          </a>
        )}
      </div>
    </div>
  );
};

export default AppViewer;
