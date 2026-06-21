import React, { useState } from "react";
import { CreditCard, X, Lock, Calendar, User as UserIcon } from "lucide-react";

interface PaymentModalProps {
  selectedPackage: any;
  paymentMethod: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  selectedPackage,
  paymentMethod,
  onClose,
  onSuccess,
}) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date MM/YY
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, "");
    if (value.length <= 3) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };

  const getCardType = () => {
    const number = cardNumber.replace(/\s/g, "");
    if (number.startsWith("4")) return "Visa";
    if (number.startsWith("5")) return "Mastercard";
    if (number.startsWith("2")) return "Mir";
    return "Card";
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass-strong p-6 rounded-3xl max-w-md w-full border border-[var(--color-separator)]/30 shadow-elevated animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text)]">
            {paymentMethod === "CARD" ? "Card Payment" : "Kaspi Payment"}
          </h3>
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
            <span className="text-sm text-[var(--color-tertiary-text)]">Amount</span>
            <span className="text-lg font-bold text-[var(--color-text)]">
              ${selectedPackage.price} {selectedPackage.currency}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-tertiary-text)]">You'll receive</span>
            <span className="text-lg font-bold text-[var(--color-ios-yellow)]">
              {selectedPackage.sparks + (selectedPackage.bonus || 0)} Sparks ⚡
            </span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Card Number
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tertiary-text)]" size={20} />
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="input w-full pl-10 pr-16 py-3 text-sm border border-[var(--color-separator)]/30"
                required
              />
              {cardNumber && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--color-ios-blue)]">
                  {getCardType()}
                </span>
              )}
            </div>
          </div>

          {/* Card Holder */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              Card Holder Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tertiary-text)]" size={20} />
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="JOHN DOE"
                className="input w-full pl-10 py-3 text-sm border border-[var(--color-separator)]/30 uppercase"
                required
              />
            </div>
          </div>

          {/* Expiry & CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Expiry Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tertiary-text)]" size={20} />
                <input
                  type="text"
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className="input w-full pl-10 py-3 text-sm border border-[var(--color-separator)]/30"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                CVV
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tertiary-text)]" size={20} />
                <input
                  type="text"
                  value={cvv}
                  onChange={handleCvvChange}
                  placeholder="123"
                  className="input w-full pl-10 py-3 text-sm border border-[var(--color-separator)]/30"
                  required
                />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 glass rounded-xl border border-[var(--color-separator)]/30">
            <Lock className="text-green-500 mt-0.5" size={16} />
            <p className="text-xs text-[var(--color-tertiary-text)]">
              Your payment is secured with SSL encryption. We don't store your card details.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={processing || !cardNumber || !cardHolder || !expiryDate || !cvv}
            className="btn-primary w-full py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              `Pay $${selectedPackage.price}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
