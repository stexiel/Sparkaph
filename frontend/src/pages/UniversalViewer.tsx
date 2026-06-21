import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader, AlertCircle } from "lucide-react";
import { API_URL } from '../config';
import AppViewer from './AppViewer';
import PublicProfile from './PublicProfile';

const UniversalViewer: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [type, setType] = useState<'app' | 'user' | 'notfound' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (handle) {
      checkHandle();
    }
  }, [handle]);

  const checkHandle = async () => {
    try {
      // First check if it's an app
      const appResponse = await fetch(`${API_URL}/app/${handle}`);
      
      if (appResponse.ok) {
        setType('app');
        setLoading(false);
        return;
      }

      // If not an app, check if it's a user
      const userResponse = await fetch(`${API_URL}/user/profile/${handle}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (userResponse.ok) {
        setType('user');
        setLoading(false);
        return;
      }

      // Not found
      setType('notfound');
      setLoading(false);
    } catch (error) {
      console.error('Error checking handle:', error);
      setType('notfound');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <Loader size={48} className="animate-spin text-[var(--color-ios-blue)]" />
      </div>
    );
  }

  if (type === 'app') {
    return <AppViewer />;
  }

  if (type === 'user') {
    return <PublicProfile />;
  }

  // Not found
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="text-center glass rounded-3xl p-8 max-w-md shadow-elevated">
        <AlertCircle size={64} className="mx-auto text-[var(--color-ios-red)] mb-4" />
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">
          Not Found
        </h1>
        <p className="text-[var(--color-secondary-text)] mb-6">
          No app or user found with handle "{handle}"
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-glass-primary"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default UniversalViewer;
