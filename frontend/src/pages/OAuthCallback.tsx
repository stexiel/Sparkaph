import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from '../config';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const provider = window.location.pathname.includes('github') ? 'github' : 'google';

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (!code) {
        console.error('No code parameter found');
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/oauth/${provider}/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/chat');
        } else {
          console.error('OAuth callback failed:', data.message);
          navigate('/login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [code, provider, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-ios-blue)] mx-auto mb-4"></div>
        <p className="text-[var(--color-text)]">Processing OAuth callback...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
