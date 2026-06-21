import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProfileSettings from "../components/ProfileSettings";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import ThemeToggle from "../components/ThemeToggle";
const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleUpdate = (updatedUser: any) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      <Sidebar user={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-40 glass-strong border-b border-[var(--color-separator)]">
          <div className="w-full px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-[var(--color-separator)]/50 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} className="text-[var(--color-text)]" />
              </button>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                Settings
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="w-full px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
            <ProfileSettings
              user={user}
              onClose={() => navigate(-1)}
              onUpdate={handleUpdate}
              isPage={true}
            />
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default Settings;
