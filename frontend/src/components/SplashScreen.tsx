import React, { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 0);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-black via-[#1C1C1E] to-black flex items-center justify-center">
      <div className="relative">
        {/* Logo */}
        <div className="relative w-32 h-32 ios-icon-gradient rounded-2xl flex items-center justify-center shadow-2xl">
          <img 
            src="/logo.png" 
            alt="Sparkaph Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* App name */}
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold text-white">Sparkaph</h1>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
