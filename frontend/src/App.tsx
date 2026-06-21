import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Settings from "./pages/Settings";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import DeveloperDocs from "./pages/DeveloperDocs";
import PublicDocs from "./pages/PublicDocs";
import About from "./pages/About";
import AIAssistant from "./pages/AIAssistant";
import AppViewer from "./pages/AppViewer";
import Apps from "./pages/Apps";
import AppProfile from "./pages/AppProfile";
import UniversalViewer from "./pages/UniversalViewer";
import SparkaphProfile from "./pages/SparkaphProfile";
import Wallet from "./pages/Wallet";
import DeveloperAssistant from "./components/DeveloperAssistant";
import SplashScreen from "./components/SplashScreen";
import OAuthCallback from "./pages/OAuthCallback";
import AdminDashboard from "./pages/AdminDashboard";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return token && user.isAdmin ? <>{children}</> : <Navigate to="/login" />;
};
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const [splashComplete, setSplashComplete] = useState(() => {
    return sessionStorage.getItem("splashShown") === "true";
  });

  const handleSplashComplete = () => {
    setSplashComplete(true);
    sessionStorage.setItem("splashShown", "true");
  };

  // Mobile fixes
  useEffect(() => {
    // Fix viewport height on mobile
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Prevent double-tap zoom on iOS
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    
    document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      document.removeEventListener('touchend', preventDoubleTapZoom);
    };
  }, []);

  if (!splashComplete) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <div className="bg-blobs">
          <div className="bg-blob-1"></div>
          <div className="bg-blob-2"></div>
          <div className="bg-blob-3"></div>
        </div>
        <Router>
          <Routes>
            {/* Public routes (no auth required) */}
            <Route path="/docs" element={<PublicDocs />} />
            <Route path="/about" element={<About />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login/github/callback" element={<OAuthCallback />} />
            <Route path="/login/google/callback" element={<OAuthCallback />} />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              }
            />
            <Route
              path="/user/:username"
              element={
                <PrivateRoute>
                  <PublicProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile/sparkaph"
              element={
                <PrivateRoute>
                  <SparkaphProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/developer"
              element={
                <PrivateRoute>
                  <DeveloperDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/developer/docs"
              element={
                <PrivateRoute>
                  <DeveloperDocs />
                </PrivateRoute>
              }
            />
            <Route
              path="/developer/ai"
              element={
                <PrivateRoute>
                  <AIAssistant />
                </PrivateRoute>
              }
            />
            <Route
              path="/developer/assistant"
              element={
                <PrivateRoute>
                  <DeveloperAssistant />
                </PrivateRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <PrivateRoute>
                  <Wallet />
                </PrivateRoute>
              }
            />
            <Route
              path="/apps"
              element={
                <PrivateRoute>
                  <Apps />
                </PrivateRoute>
              }
            />
            <Route
              path="/app/:handle"
              element={
                <PrivateRoute>
                  <AppProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="/" element={<Navigate to="/chat" />} />
            
            {/* Universal route - checks apps first, then users */}
            <Route
              path="/:handle"
              element={
                <PrivateRoute>
                  <UniversalViewer />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
