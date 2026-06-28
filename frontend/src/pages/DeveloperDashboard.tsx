import React, { useState, useEffect } from "react";
import {
  Plus,
  Code,
  Upload,
  Globe,
  Trash,
  Copy,
  Check,
  Settings,
  X,
  Book,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import DeveloperAssistant from "../components/DeveloperAssistant";
import CustomAlert from "../components/CustomAlert";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAlert } from "../hooks/useAlert";
import { useConfirm } from "../hooks/useConfirm";
import { useLanguage } from "../context/LanguageContext";
import { API_URL, APPS_PORT } from '../config';
import { apiGet, apiPost, apiDelete, apiPut } from '../utils/api';
interface App {
  id: string;
  name: string;
  handle: string;
  description: string;
  type: string;
  status: string;
  isPublic: boolean;
  views: number;
  url?: string;
  webhookUrl?: string;
  userId?: string;
  deployments: Deployment[];
  apiTokens: ApiToken[];
}

interface Deployment {
  id: string;
  version: number;
  status: string;
  url: string;
  createdAt: string;
}

interface ApiToken {
  id: string;
  name: string;
  token: string;
  appId?: string;
  scopes: string[];
  lastUsed: string;
}

const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { alerts, showAlert, removeAlert } = useAlert();
  const { confirmState, showConfirm, hideConfirm } = useConfirm();
  const [user, setUser] = useState<any>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [newlyCreatedApp, setNewlyCreatedApp] = useState<App | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [newApp, setNewApp] = useState({
    name: "",
    handle: "",
    description: "",
    type: "HOSTED",
    webhookUrl: "",
    url: "",
  });
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [handleReason, setHandleReason] = useState<string | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [uploadingApp, setUploadingApp] = useState<string | null>(null);
  const [appType, setAppType] = useState<'HOSTED' | 'EXTERNAL'>('HOSTED');
  const [instantHTML, setInstantHTML] = useState('');
  const [externalURL, setExternalURL] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchApps();
  }, []);

  // Check handle availability in real-time
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newApp.handle) {
        checkHandleAvailability(newApp.handle);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [newApp.handle]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchApps = async () => {
    try {
      const response = await apiGet("/api/apps");
      if (!response.ok) {
        console.error("Failed to fetch apps:", response.status, response.statusText);
        return;
      }
      const data = await response.json();
      console.log("Fetched apps:", data);
      setApps(data);
    } catch (error) {
      console.error("Error fetching apps:", error);
    }
  };

  const checkHandleAvailability = async (handle: string) => {
    if (!handle || handle.length < 3) {
      setHandleAvailable(null);
      setHandleReason(null);
      return;
    }
    setCheckingHandle(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/apps/check-handle?handle=${handle}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setHandleAvailable(data.available);
      setHandleReason(data.reason || null);
    } catch (error) {
      console.error("Error checking handle:", error);
      setHandleAvailable(null);
      setHandleReason(null);
    } finally {
      setCheckingHandle(false);
    }
  };

  // Long polling for deployment status updates
  const pollDeploymentStatus = async (appId: string, lastStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/deployments/${appId}/poll?lastStatus=${lastStatus}&timeout=30000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      
      if (data.hasUpdate && data.deployment) {
        // Update the specific app's deployment status
        setApps(prevApps => 
          prevApps.map(app => 
            app.id === appId 
              ? { 
                  ...app, 
                  deployments: [data.deployment, ...app.deployments.filter((d: any) => d.id !== data.deployment.id)]
                }
              : app
          )
        );
        
        // Continue polling if still building
        if (data.deployment.status === 'BUILDING' || data.deployment.status === 'PENDING') {
          setTimeout(() => pollDeploymentStatus(appId, data.deployment.status), 2000);
        }
      }
    } catch (error) {
      console.error("Long polling error:", error);
    }
  };

  // Start polling for apps with active deployments
  useEffect(() => {
    apps.forEach(app => {
      if (app.deployments && app.deployments.length > 0) {
        const latestDeployment = app.deployments[0];
        if (latestDeployment.status === 'BUILDING' || latestDeployment.status === 'PENDING') {
          pollDeploymentStatus(app.id, latestDeployment.status);
        }
      }
    });
  }, [apps]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate handle availability
    if (handleAvailable === false) {
      showAlert(handleReason || "Handle is already taken. Please choose another one.", "error");
      return;
    }

    try {
      const response = await apiPost("/api/apps", newApp);
      if (response.ok) {
        const createdApp = await response.json();
        setShowCreateApp(false);
        setNewApp({ name: "", handle: "", description: "", type: "HOSTED", webhookUrl: "", url: "" });
        setHandleAvailable(null);
        setHandleReason(null);

        // If ZIP file was selected, upload it
        if (zipFile) {
          await handleZipUpload(createdApp.id, zipFile);
          // Don't show modal if ZIP was uploaded
          setZipFile(null);
          fetchApps();
        } else {
          // Show modal only if no ZIP was uploaded
          setNewlyCreatedApp(createdApp);
          fetchApps();
        }
      } else {
        const error = await response.json();
        showAlert(error.message || t("create_app_failed"), "error");
      }
    } catch (error) {
      console.error("Error creating app:", error);
      showAlert(t("create_app_failed"), "error");
    }
  };

  const handleDeleteApp = async (appId: string) => {
    const confirmed = await showConfirm({
      title: t("delete_app"),
      message: t("delete_app_confirm"),
      confirmText: t("delete"),
      cancelText: t("cancel"),
      type: "danger",
    });
    
    if (!confirmed) return;
    
    try {
      await apiDelete(`/api/apps/${appId}`);
      fetchApps();
      showAlert(t("app_deleted"), "success");
    } catch (error) {
      console.error("Error deleting app:", error);
      showAlert(t("delete_failed"), "error");
    }
  };

  const handleUpdateApp = async (appId: string, updates: any) => {
    try {
      const response = await apiPut(`/api/apps/${appId}`, updates);
      if (response.ok) {
        const updatedApp = await response.json();
        setApps(apps.map(app => app.id === appId ? updatedApp : app));
        setShowAppSettings(false);
        setEditingApp(null);
        showAlert(t("profile_updated"), "success");
      } else {
        const error = await response.json();
        showAlert(error.message || t("create_app_failed"), "error");
      }
    } catch (error) {
      console.error("Error updating app:", error);
      showAlert(t("create_app_failed"), "error");
    }
  };

  const fetchDevelopers = async () => {
    try {
      const response = await apiGet("/api/users/developers");
      if (response.ok) {
        const data = await response.json();
        setDevelopers(data);
      }
    } catch (error) {
      console.error("Error fetching developers:", error);
    }
  };

  const openAppSettings = (app: App) => {
    setEditingApp(app);
    setShowAppSettings(true);
    fetchDevelopers();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleInstantDeploy = async () => {
    if (!instantHTML.trim()) {
      showAlert('Please enter HTML content', 'error');
      return;
    }

    try {
      const response = await apiPost('/api/quick-deploy/instant', {
        html: instantHTML,
        name: newApp.name || 'Instant App',
        description: newApp.description || 'Created with instant deploy',
        type: appType,
      });

      if (response.ok) {
        const data = await response.json();
        showAlert(`App deployed! URL: ${data.url}`, 'success');
        setShowCreateApp(false);
        setInstantHTML('');
        fetchApps();
      }
    } catch (error) {
      console.error('Instant deploy error:', error);
      showAlert('Failed to deploy app', 'error');
    }
  };

  const handleURLDeploy = async () => {
    if (!externalURL.trim()) {
      showAlert('Please enter app URL', 'error');
      return;
    }

    try {
      const response = await apiPost('/api/quick-deploy/url', {
        appUrl: externalURL,
        name: newApp.name || 'External App',
        description: newApp.description || 'External hosted app',
        type: appType,
      });

      if (response.ok) {
        const data = await response.json();
        showAlert(`App created! Access URL: ${data.accessUrl}`, 'success');
        setShowCreateApp(false);
        setExternalURL('');
        fetchApps();
      }
    } catch (error) {
      console.error('URL deploy error:', error);
      showAlert('Failed to create app', 'error');
    }
  };

  const handleZipUpload = async (appId: string, file: File) => {
    // Validate ZIP file
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showAlert(t("upload_zip_required"), "error");
      return;
    }
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showAlert(t("file_size_exceeded"), "error");
      return;
    }

    setUploadingApp(appId);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/api/deployments/${appId}/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (response.ok) {
        fetchApps();
        showAlert(t("zip_upload_success"), "success");
      } else {
        const error = await response.json();
        showAlert(error.message || t("zip_upload_failed"), "error");
      }
    } catch (error) {
      console.error("Error uploading ZIP:", error);
      showAlert(t("zip_upload_connection_error"), "error");
    } finally {
      setUploadingApp(null);
    }
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
      {confirmState.isOpen && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          type={confirmState.type}
          onConfirm={confirmState.onConfirm}
          onCancel={hideConfirm}
        />
      )}
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-40 glass-strong border-b border-[var(--color-separator)]">
          <div className="w-full px-4 md:px-6 py-4">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {t("developer_dashboard")}
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6 flex">
          <div className="w-full px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto flex-1">
            {/* Apps */}
            <div>
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-text)]">
                  {t("my_apps")}
                </h2>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => navigate("/docs")}
                    className="btn-glass-secondary flex items-center gap-2 text-sm sm:text-base px-3 py-2 sm:px-4"
                  >
                    <Book size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">Docs</span>
                  </button>
                  <button
                    onClick={() => navigate("/developer/ai")}
                    className="btn-glass-secondary flex items-center gap-2 text-sm sm:text-base px-3 py-2 sm:px-4"
                  >
                    <img src="/logo.png" alt="Sparkaph AI" className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Sparkaph AI</span>
                  </button>
                  <button
                    onClick={() => setShowCreateApp(true)}
                    className="btn-glass-primary flex items-center gap-2 text-sm sm:text-base px-3 py-2 sm:px-4"
                  >
                    <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden xs:inline">{t("create_app")}</span>
                    <span className="xs:hidden">+</span>
                  </button>
                </div>
              </div>

              {apps.length === 0 ? (
                <div className="glass rounded-3xl p-6 sm:p-12 text-center shadow-card">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-[var(--color-separator)]/30 flex items-center justify-center">
                    <Code
                      size={40}
                      className="text-[var(--color-tertiary-text)]"
                    />
                  </div>
                  <p className="text-[var(--color-secondary-text)] font-medium">
                    {t("no_apps_yet")}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-card hover:shadow-elevated transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Globe
                            size={20}
                            className="text-[var(--color-ios-orange)]"
                          />
                          <span className="font-semibold text-[var(--color-text)]">
                            {app.name}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openAppSettings(app)}
                            className="text-[var(--color-tertiary-text)] hover:text-[var(--color-text)]"
                          >
                            <Settings size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteApp(app.id)}
                            className="text-[var(--color-tertiary-text)] hover:text-[var(--color-ios-red)]"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--color-tertiary-text)] mb-2">
                        @{app.handle}
                      </p>
                      <p className="text-sm text-[var(--color-secondary-text)] mb-3">
                        {app.description}
                      </p>
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-[var(--color-tertiary-text)]">{app.type}</span>
                        <span className="text-[var(--color-tertiary-text)]">{app.views} {t("views")}</span>
                      </div>
                      
                      {/* API Token for Full-stack apps */}
                      {app.type === "EXTERNAL" && app.apiTokens && app.apiTokens.length > 0 && (
                        <div className="mb-3 p-3 bg-[var(--color-tertiary-background)] rounded-xl">
                          <p className="text-xs text-[var(--color-tertiary-text)] mb-2">
                            {t("api_token")}
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-[var(--color-text)] font-mono truncate flex-1">
                              {app.apiTokens[0].token}
                            </code>
                            <button
                              onClick={() => copyToClipboard(app.apiTokens[0].token)}
                              className="flex-shrink-0 p-1 hover:bg-[var(--color-separator)] rounded transition-colors"
                            >
                              {copiedToken === app.apiTokens[0].token ? (
                                <Check size={14} className="text-[var(--color-ios-green)]" />
                              ) : (
                                <Copy size={14} className="text-[var(--color-secondary-text)]" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Deployment Status */}
                      {app.deployments && app.deployments.length > 0 && (
                        <div className="mb-3">
                          {app.deployments[0].status === "DEPLOYED" ? (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full bg-[var(--color-ios-green)]"></div>
                              <span className="text-[var(--color-ios-green)] font-semibold">{t("deployed")}</span>
                            </div>
                          ) : app.deployments[0].status === "BUILDING" ? (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full bg-[var(--color-ios-orange)] animate-pulse"></div>
                              <span className="text-[var(--color-ios-orange)] font-semibold">{t("building")}</span>
                            </div>
                          ) : app.deployments[0].status === "PENDING" ? (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full bg-[var(--color-ios-yellow)]"></div>
                              <span className="text-[var(--color-ios-yellow)] font-semibold">{t("waiting_zip")}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full bg-[var(--color-ios-red)]"></div>
                              <span className="text-[var(--color-ios-red)] font-semibold">{t("failed")}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Upload button for HOSTED apps */}
                      <div className="mt-3 pt-3 border-t border-[var(--color-separator)]/30">
                        <input
                          type="file"
                          id={`upload-${app.id}`}
                          accept=".zip"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleZipUpload(app.id, file);
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() =>
                            document
                              .getElementById(`upload-${app.id}`)
                              ?.click()
                          }
                          disabled={uploadingApp === app.id}
                          className="btn-glass-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Upload size={16} />
                          {uploadingApp === app.id
                            ? t("uploading")
                            : t("upload_zip")}
                        </button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[var(--color-separator)]/30">
                        <a
                          href={`/${app.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--color-ios-blue)] hover:underline flex items-center gap-1"
                        >
                          <Globe size={12} />
                          {window.location.host}/{app.handle}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create App Modal - Simplified for beginners */}
            {showCreateApp && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="glass-strong p-5 sm:p-6 md:p-8 rounded-3xl max-w-[95vw] sm:max-w-md w-full relative border border-[var(--color-separator)]/30 shadow-elevated max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] mb-2">
                    {t("create_app")}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-secondary-text)] mb-4 sm:mb-6">
                    {t("no_apps_yet")}
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--color-secondary-text)] mb-1.5 sm:mb-2">
                        {t("app_name")}
                      </label>
                      <input
                        type="text"
                        value={newApp.name}
                        onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                        className="input w-full text-sm border border-[var(--color-separator)]/30"
                        placeholder={t("app_name_placeholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--color-secondary-text)] mb-1.5 sm:mb-2">
                        {t("app_handle")}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newApp.handle}
                          onChange={(e) => {
                            // Only allow English letters, numbers, and hyphens
                            const value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
                            setNewApp({ ...newApp, handle: value });
                          }}
                          className={`input w-full text-sm border ${handleAvailable === false ? 'border-red-500 focus:border-red-500' : handleAvailable === true ? 'border-green-500 focus:border-green-500' : 'border-[var(--color-separator)]/30'}`}
                          placeholder={t("app_handle_placeholder")}
                          required
                        />
                        {checkingHandle && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-[var(--color-ios-blue)] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {!checkingHandle && handleAvailable === false && (
                        <p className="text-xs text-red-500 mt-1">{handleReason || "Handle already taken"}</p>
                      )}
                      {!checkingHandle && handleAvailable === true && (
                        <p className="text-xs text-green-500 mt-1">Handle available</p>
                      )}
                      <p className="text-xs text-[var(--color-tertiary-text)] mt-1">
                        Only English letters, numbers, and hyphens allowed
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--color-secondary-text)] mb-1.5 sm:mb-2">
                        {t("app_description")}
                      </label>
                      <textarea
                        value={newApp.description}
                        onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                        className="input w-full h-16 sm:h-20 resize-none text-sm border border-[var(--color-separator)]/30"
                        placeholder={t("app_description_placeholder")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--color-secondary-text)] mb-1.5 sm:mb-2">
                        App Type
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setNewApp({ ...newApp, type: "HOSTED" })}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                            newApp.type === "HOSTED"
                              ? "border-[var(--color-ios-blue)] bg-[var(--color-ios-blue)]/10"
                              : "border-[var(--color-separator)] hover:border-[var(--color-separator)]"
                          }`}
                        >
                          <div className="text-center">
                            <Globe size={20} className="mx-auto mb-1.5 sm:mb-2 text-[var(--color-ios-blue)]" />
                            <div className="font-semibold text-[var(--color-text)] text-xs sm:text-sm">Hosted</div>
                            <div className="text-[10px] sm:text-xs text-[var(--color-secondary-text)] mt-0.5 sm:mt-1">Upload ZIP (HTML/CSS/JS)</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewApp({ ...newApp, type: "EXTERNAL" })}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                            newApp.type === "EXTERNAL"
                              ? "border-[var(--color-ios-orange)] bg-[var(--color-ios-orange)]/10"
                              : "border-[var(--color-separator)] hover:border-[var(--color-separator)]"
                          }`}
                        >
                          <div className="text-center">
                            <Code size={20} className="mx-auto mb-1.5 sm:mb-2 text-[var(--color-ios-orange)]" />
                            <div className="font-semibold text-[var(--color-text)] text-xs sm:text-sm">External</div>
                            <div className="text-[10px] sm:text-xs text-[var(--color-secondary-text)] mt-0.5 sm:mt-1">Your server + API token</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {newApp.type === "HOSTED" && (
                      <div>
                        <div className="p-3 bg-[var(--color-ios-blue)]/10 rounded-xl border border-[var(--color-ios-blue)]/20 mb-3">
                          <p className="text-xs text-[var(--color-text)]">
                            💡 {t("static_app_info")}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-[var(--color-secondary-text)] mb-1.5 sm:mb-2">
                            ZIP File (Optional - upload now or later)
                          </label>
                          <input
                            type="file"
                            accept=".zip"
                            onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                            className="input w-full text-sm border border-[var(--color-separator)]/30"
                          />
                          {zipFile && (
                            <p className="text-xs text-[var(--color-ios-green)] mt-1">
                              ✓ {zipFile.name} selected
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {newApp.type === "EXTERNAL" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-[var(--color-ios-orange)]/10 rounded-xl border border-[var(--color-ios-orange)]/20">
                          <p className="text-xs text-[var(--color-text)] mb-2">
                            💡 <strong>Your app runs on YOUR server</strong> (like Telegram Bot API)
                          </p>
                          <p className="text-xs text-[var(--color-text)]">
                            You'll get an <strong>API token</strong> to interact with Sparkaph API.
                          </p>
                          <p className="text-xs text-[var(--color-text)] mt-2">
                            📡 Use <strong>long polling</strong> to get updates (recommended) or set webhook URL below.
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-[var(--color-secondary-text)] mb-1.5 sm:mb-2">
                            App URL (Required)
                          </label>
                          <input
                            type="url"
                            value={newApp.url}
                            onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                            className="input w-full text-sm border border-[var(--color-separator)]/30"
                            placeholder="https://your-app.com"
                            required
                          />
                          <p className="text-xs text-[var(--color-tertiary-text)] mt-1">
                            URL where your app is hosted
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-[var(--color-secondary-text)] mb-1.5 sm:mb-2">
                            Webhook URL (Optional - use long polling instead)
                          </label>
                          <input
                            type="url"
                            value={newApp.webhookUrl}
                            onChange={(e) => setNewApp({ ...newApp, webhookUrl: e.target.value })}
                            className="input w-full text-sm border border-[var(--color-separator)]/30"
                            placeholder="https://your-server.com/webhook (optional)"
                          />
                          <p className="text-xs text-[var(--color-tertiary-text)] mt-1">
                            Leave empty to use long polling (like Telegram getUpdates)
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleCreateApp}
                      disabled={handleAvailable === false}
                      className="btn-glass-primary w-full py-2.5 sm:py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("create_app_upload_later")}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowCreateApp(false)}
                      className="w-full px-4 py-2.5 sm:py-3 glass rounded-2xl text-[var(--color-text)] text-sm font-semibold hover:shadow-card transition-all border border-[var(--color-separator)]/30"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Next Step Modal after creating app */}
            {newlyCreatedApp && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="glass-strong p-8 rounded-3xl max-w-md w-full mx-4 relative">
                  <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
                    {t("app_created_successfully")}
                  </h3>
                  <p className="text-sm text-[var(--color-secondary-text)] mb-6">
                    {newlyCreatedApp.name} {t("app_ready_next_step")}
                  </p>

                  {newlyCreatedApp.type === "HOSTED" ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          document
                            .getElementById(`upload-${newlyCreatedApp.id}`)
                            ?.click();
                          setNewlyCreatedApp(null);
                        }}
                        className="btn-glass-primary w-full flex items-center justify-center gap-2"
                      >
                        <Upload size={20} />
                        {t("upload_zip_file")}
                      </button>
                      <button
                        onClick={() => setNewlyCreatedApp(null)}
                        className="w-full px-6 py-4 glass rounded-2xl text-[var(--color-text)] font-semibold hover:shadow-card transition-all"
                      >
                        {t("skip_for_now")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="glass rounded-2xl p-4">
                        <p className="text-xs text-[var(--color-tertiary-text)] mb-2">
                          {t("api_token")}
                        </p>
                        {newlyCreatedApp.apiTokens && newlyCreatedApp.apiTokens.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <code className="text-sm text-[var(--color-text)] font-mono bg-[var(--color-tertiary-background)] p-2 rounded flex-1 break-all">
                              {newlyCreatedApp.apiTokens[0].token}
                            </code>
                            <button
                              onClick={() => copyToClipboard(newlyCreatedApp.apiTokens[0].token)}
                              className="flex-shrink-0 p-2 hover:bg-[var(--color-separator)] rounded transition-colors"
                            >
                              {copiedToken === newlyCreatedApp.apiTokens[0].token ? (
                                <Check size={16} className="text-[var(--color-ios-green)]" />
                              ) : (
                                <Copy size={16} className="text-[var(--color-secondary-text)]" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--color-secondary-text)]">
                            Token generation failed. Please check API Tokens tab.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setNewlyCreatedApp(null)}
                        className="btn-glass-primary w-full"
                      >
                        Got it!
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Developer AI Assistant */}
          <div className="hidden lg:block w-80 border-l border-[var(--color-separator)] glass-strong p-4 overflow-y-auto">
            <DeveloperAssistant isInline={true} />
          </div>
        </div>

        <BottomNav />
      </div>
    </div>

    {/* App Settings Modal */}
    {showAppSettings && editingApp && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-strong p-6 rounded-3xl max-w-md w-full border border-[var(--color-separator)]/30 shadow-elevated animate-scale-in max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[var(--color-text)]">
              {t("app_settings")}
            </h3>
            <button
              onClick={() => {
                setShowAppSettings(false);
                setEditingApp(null);
              }}
              className="text-[var(--color-tertiary-text)] hover:text-[var(--color-text)]"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                {t("app_name")}
              </label>
              <input
                type="text"
                value={editingApp.name}
                onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                className="input w-full py-3 text-sm border border-[var(--color-separator)]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                {t("app_description")}
              </label>
              <textarea
                value={editingApp.description || ""}
                onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                className="input w-full h-24 resize-none text-sm border border-[var(--color-separator)]/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                {t("app_handle")}
              </label>
              <input
                type="text"
                value={editingApp.handle}
                disabled
                className="input w-full py-3 text-sm border border-[var(--color-separator)]/30 opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-[var(--color-tertiary-text)] mt-1">
                Handle cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Owner
              </label>
              <select
                value={editingApp.userId || ""}
                onChange={(e) => setEditingApp({ ...editingApp, userId: e.target.value })}
                className="input w-full py-3 text-sm border border-[var(--color-separator)]/30"
              >
                <option value="">Select a developer</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.nickname || dev.username} (@{dev.username})
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--color-tertiary-text)] mt-1">
                Transfer app ownership to another developer
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Visibility
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditingApp({ ...editingApp, isPublic: !editingApp.isPublic })}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    editingApp.isPublic
                      ? "border-[var(--color-ios-green)] bg-[var(--color-ios-green)]/10"
                      : "border-[var(--color-separator)] hover:border-[var(--color-separator)]"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-[var(--color-text)] text-sm">Public</div>
                    <div className="text-xs text-[var(--color-secondary-text)] mt-1">Visible to everyone</div>
                  </div>
                </button>
                <button
                  onClick={() => setEditingApp({ ...editingApp, isPublic: !editingApp.isPublic })}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    !editingApp.isPublic
                      ? "border-[var(--color-ios-orange)] bg-[var(--color-ios-orange)]/10"
                      : "border-[var(--color-separator)] hover:border-[var(--color-separator)]"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-[var(--color-text)] text-sm">Private</div>
                    <div className="text-xs text-[var(--color-secondary-text)] mt-1">Only you can see</div>
                  </div>
                </button>
              </div>
            </div>

            {editingApp.type === "EXTERNAL" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    App URL
                  </label>
                  <input
                    type="url"
                    value={editingApp.url || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, url: e.target.value })}
                    className="input w-full py-3 text-sm border border-[var(--color-separator)]/30"
                    placeholder="https://your-app.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={editingApp.webhookUrl || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, webhookUrl: e.target.value })}
                    className="input w-full py-3 text-sm border border-[var(--color-separator)]/30"
                    placeholder="https://your-server.com/webhook"
                  />
                  <p className="text-xs text-[var(--color-tertiary-text)] mt-1">
                    Leave empty to use long polling
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAppSettings(false);
                  setEditingApp(null);
                }}
                className="flex-1 px-4 py-3 glass rounded-2xl text-[var(--color-text)] font-semibold border border-[var(--color-separator)]/30"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleUpdateApp(editingApp.id, { 
                  name: editingApp.name, 
                  description: editingApp.description || "",
                  isPublic: editingApp.isPublic,
                  url: editingApp.url,
                  webhookUrl: editingApp.webhookUrl,
                  userId: editingApp.userId
                })}
                className="flex-1 btn-primary py-3"
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DeveloperDashboard;
