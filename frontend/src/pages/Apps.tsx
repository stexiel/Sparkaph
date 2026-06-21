import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Code, Star, Users, Eye, TrendingUp } from "lucide-react";
import { API_URL } from "../config";
import { useLanguage } from "../context/LanguageContext";

interface App {
  id: string;
  name: string;
  handle: string;
  description: string;
  icon?: string;
  views: number;
  isPublic: boolean;
  status: string;
  user: {
    username: string;
    avatar?: string;
  };
}

const Apps: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = apps.filter(
        (app) =>
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.handle.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps(apps);
    }
  }, [searchQuery, apps]);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/apps/public`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setApps(data);
      setFilteredApps(data);
    } catch (error) {
      console.error("Error fetching apps:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-ios-blue)] to-[var(--color-ios-purple)] flex items-center justify-center">
            <Code size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
            Loading Apps
          </h2>
          <p className="text-[var(--color-secondary-text)]">
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="glass-strong border-b border-[var(--color-separator)] p-6 sticky top-0 z-10 backdrop-blur-[60px] saturate-[180%]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
            Mini-Apps
          </h1>
          <p className="text-[var(--color-secondary-text)] mb-6">
            Discover and explore amazing mini-apps built on Sparkaph
          </p>

          {/* Search Bar */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--color-tertiary-text)]"
            />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-12"
            />
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="max-w-7xl mx-auto p-6">
        {filteredApps.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center">
            <Code size={64} className="mx-auto text-[var(--color-tertiary-text)] mb-4" />
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              No Apps Found
            </h2>
            <p className="text-[var(--color-secondary-text)]">
              {searchQuery
                ? "Try a different search term"
                : "No public apps available yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/app/${app.handle}`)}
                className="glass rounded-3xl p-6 cursor-pointer hover:shadow-elevated transition-all hover:scale-[1.02]"
              >
                {/* App Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-ios-orange)] to-[var(--color-ios-pink)] flex items-center justify-center mb-4">
                  {app.icon ? (
                    <img
                      src={app.icon.startsWith("http") ? app.icon : `${API_URL}${app.icon}`}
                      alt={app.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Code size={32} className="text-white" />
                  )}
                </div>

                {/* App Name */}
                <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
                  {app.name}
                </h3>

                {/* App Description */}
                <p className="text-[var(--color-secondary-text)] text-sm mb-4 line-clamp-2">
                  {app.description}
                </p>

                {/* App Stats */}
                <div className="flex items-center gap-4 text-xs text-[var(--color-tertiary-text)]">
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{app.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>@{app.user.username}</span>
                  </div>
                </div>

                {/* Handle */}
                <div className="mt-4 pt-4 border-t border-[var(--color-separator)]">
                  <span className="text-xs text-[var(--color-ios-blue)] font-medium">
                    /{app.handle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Apps;
