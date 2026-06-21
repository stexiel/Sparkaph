import React, { useState, useEffect } from "react";
import { X, Smartphone, Lock } from "lucide-react";

interface KaspiPaymentModalProps {
  selectedPackage: any;
  onClose: () => void;
  onSuccess: () => void;
}

const KaspiPaymentModal: React.FC<KaspiPaymentModalProps> = ({
  selectedPackage,
  onClose,
  onSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const codeInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (showCodeInput && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showCodeInput, timeLeft]);

  const formatPhoneNumber = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 1) return v;
    if (v.length <= 4) return `+7 (${v.slice(1)}`;
    if (v.length <= 7) return `+7 (${v.slice(1, 4)}) ${v.slice(4)}`;
    if (v.length <= 9) return `+7 (${v.slice(1, 4)}) ${v.slice(4, 7)}-${v.slice(7)}`;
    return `+7 (${v.slice(1, 4)}) ${v.slice(4, 7)}-${v.slice(7, 9)}-${v.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.replace(/\D/g, "").length <= 11) {
      setPhoneNumber(formatted);
    }
  };

  const handleSendCode = () => {
    if (phoneNumber.replace(/\D/g, "").length !== 11) return;
    setShowCodeInput(true);
    setTimeLeft(60);
    // Focus first input
    setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newCode.every(digit => digit !== "") && index === 5) {
      handleVerifyCode(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode: string) => {
    setProcessing(true);
    
    // Simulate verification
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 1500);
  };

  const handleResendCode = () => {
    setCode(["", "", "", "", "", ""]);
    setTimeLeft(60);
    codeInputRefs.current[0]?.focus();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass-strong p-6 rounded-3xl max-w-md w-full border border-[var(--color-separator)]/30 shadow-elevated animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8E24AA] to-[#5E35B1] flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text)]">Kaspi Payment</h3>
              <p className="text-xs text-[var(--color-tertiary-text)]">Secure payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-tertiary-text)] hover:text-[var(--color-text)]"
          >
            <X size={24} />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="glass rounded-2xl p-4 mb-6 border border-[var(--color-separator)]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-tertiary-text)]">Amount to pay</span>
            <span className="text-lg font-bold text-[var(--color-text)]">
              ${selectedPackage.price} USD
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-tertiary-text)]">You'll receive</span>
            <span className="text-lg font-bold text-[var(--color-ios-yellow)]">
              {selectedPackage.sparks + (selectedPackage.bonus || 0)} Sparks ⚡
            </span>
          </div>
        </div>

        {!showCodeInput ? (
          // Phone Number Input
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Kaspi Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tertiary-text)]" size={20} />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="+7 (___) ___-__-__"
                  className="input w-full pl-10 py-3 text-sm border border-[var(--color-separator)]/30"
                  required
                />
              </div>
              <p className="text-xs text-[var(--color-tertiary-text)] mt-2">
                Enter your Kaspi phone number to receive confirmation code
              </p>
            </div>

            <button
              onClick={handleSendCode}
              disabled={phoneNumber.replace(/\D/g, "").length !== 11}
              className="btn-primary w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Confirmation Code
            </button>
          </div>
        ) : (
          // Code Verification
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2 text-center">
                Enter Confirmation Code
              </label>
              <p className="text-xs text-[var(--color-tertiary-text)] text-center mb-4">
                Code sent to {phoneNumber}
              </p>
              
              {/* Code Input */}
              <div className="flex gap-3 justify-center mb-4">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-[var(--color-separator)] rounded-2xl focus:border-[var(--color-ios-blue)] focus:outline-none glass transition-all"
                    disabled={processing}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-[var(--color-tertiary-text)]">
                    Code expires in <span className="font-semibold text-[var(--color-text)]">{timeLeft}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendCode}
                    className="text-sm text-[var(--color-ios-blue)] font-semibold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>

            {/* Processing State */}
            {processing && (
              <div className="flex items-center justify-center gap-2 p-4 glass rounded-2xl border border-[var(--color-separator)]/30">
                <div className="w-5 h-5 border-2 border-[var(--color-ios-blue)]/30 border-t-[var(--color-ios-blue)] rounded-full animate-spin"></div>
                <span className="text-sm text-[var(--color-text)]">Verifying payment...</span>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-2 p-3 glass rounded-xl border border-[var(--color-separator)]/30">
              <Lock className="text-green-500 mt-0.5" size={16} />
              <p className="text-xs text-[var(--color-tertiary-text)]">
                Your payment is secured. Code is valid for 60 seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KaspiPaymentModal;
