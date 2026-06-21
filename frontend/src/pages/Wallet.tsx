import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Zap, CreditCard } from "lucide-react";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";
import CustomAlert from "../components/CustomAlert";
import PaymentModal from "../components/PaymentModal";
import KaspiPaymentModal from "../components/KaspiPaymentModal";
import { useAlert } from "../hooks/useAlert";
import { useLanguage } from "../context/LanguageContext";
import { apiGet, apiPost } from "../utils/api";

interface WalletData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  status: string;
}

const SPARKS_PACKAGES = [
  { sparks: 100, price: 1, currency: "USD", popular: false },
  { sparks: 500, price: 4.5, currency: "USD", popular: true, bonus: 10 },
  { sparks: 1000, price: 8, currency: "USD", popular: false, bonus: 25 },
  { sparks: 5000, price: 35, currency: "USD", popular: false, bonus: 20 },
];

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { alerts, showAlert, removeAlert } = useAlert();
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        apiGet("/api/wallet"),
        apiGet("/api/wallet/transactions?limit=20"),
      ]);

      if (walletRes.ok && transactionsRes.ok) {
        const walletData = await walletRes.json();
        const transData = await transactionsRes.json();
        setWallet(walletData);
        setTransactions(transData.transactions);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      showAlert("Failed to load wallet data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPaymentMethod = () => {
    if (!selectedPackage) {
      showAlert("Please select a package", "error");
      return;
    }
    setShowPurchaseModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setPurchasing(true);
    
    try {
      const response = await apiPost("/api/wallet/purchase", {
        sparksAmount: selectedPackage.sparks + (selectedPackage.bonus || 0),
        realAmount: selectedPackage.price,
        currency: selectedPackage.currency,
        paymentMethod,
      });

      if (response.ok) {
        showAlert(`Payment successful! You'll receive ${selectedPackage.sparks + (selectedPackage.bonus || 0)} Sparks`, "success");
        
        // Poll for purchase completion
        setTimeout(() => {
          fetchWalletData();
        }, 3000);
      } else {
        showAlert("Purchase failed", "error");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      showAlert("Purchase failed", "error");
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <Plus className="text-green-500" size={20} />;
      case "PAYMENT":
        return <ArrowUpRight className="text-red-500" size={20} />;
      case "REWARD":
        return <ArrowDownLeft className="text-green-500" size={20} />;
      default:
        return <Zap className="text-blue-500" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-[var(--color-text)]">Loading wallet...</div>
      </div>
    );
  }

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
      
      <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
        <Sidebar user={user} onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 z-40 glass-strong border-b border-[var(--color-separator)]">
            <div className="w-full px-4 md:px-6 py-4">
              <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
                <WalletIcon size={28} />
                Sparks Wallet
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto pb-20 md:pb-6">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
              
              {/* Balance Card */}
              <div className="glass-strong p-6 rounded-3xl border border-[var(--color-separator)]/30 shadow-elevated">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-[var(--color-tertiary-text)]">Available Balance</p>
                    <h2 className="text-4xl font-bold text-[var(--color-text)] flex items-center gap-2">
                      <Zap className="text-[var(--color-ios-yellow)]" size={32} />
                      {wallet?.balance.toFixed(0) || 0}
                      <span className="text-xl text-[var(--color-tertiary-text)]">Sparks</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Buy Sparks
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[var(--color-separator)]">
                  <div>
                    <p className="text-xs text-[var(--color-tertiary-text)]">Total Earned</p>
                    <p className="text-lg font-semibold text-green-500">{wallet?.totalEarned.toFixed(0) || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-tertiary-text)]">Total Spent</p>
                    <p className="text-lg font-semibold text-red-500">{wallet?.totalSpent.toFixed(0) || 0}</p>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="glass-strong p-6 rounded-3xl border border-[var(--color-separator)]/30">
                <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">Transaction History</h3>
                
                {transactions.length === 0 ? (
                  <p className="text-center text-[var(--color-tertiary-text)] py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 glass rounded-2xl border border-[var(--color-separator)]/30"
                      >
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          <div>
                            <p className="text-sm font-medium text-[var(--color-text)]">{tx.description}</p>
                            <p className="text-xs text-[var(--color-tertiary-text)]">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(0)}
                          </p>
                          <p className="text-xs text-[var(--color-tertiary-text)]">{tx.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <BottomNav />
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong p-6 rounded-3xl max-w-2xl w-full border border-[var(--color-separator)]/30 shadow-elevated max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-[var(--color-text)] mb-6">Buy Sparks</h3>
            
            {/* Packages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {SPARKS_PACKAGES.map((pkg, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    selectedPackage === pkg
                      ? 'border-[var(--color-ios-blue)] bg-[var(--color-ios-blue)]/10'
                      : 'border-[var(--color-separator)] glass hover:border-[var(--color-ios-blue)]/50'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-2 right-4 px-3 py-1 bg-[var(--color-ios-orange)] text-white text-xs font-bold rounded-full">
                      POPULAR
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="text-[var(--color-ios-yellow)]" size={24} />
                      <span className="text-2xl font-bold text-[var(--color-text)]">{pkg.sparks}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[var(--color-text)]">${pkg.price}</p>
                      <p className="text-xs text-[var(--color-tertiary-text)]">{pkg.currency}</p>
                    </div>
                  </div>
                  {pkg.bonus && (
                    <p className="text-xs text-green-500 font-semibold">+{pkg.bonus}% BONUS</p>
                  )}
                </button>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <p className="text-sm font-medium text-[var(--color-text)] mb-3">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                {['CARD', 'KASPI'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === method
                        ? 'border-[var(--color-ios-blue)] bg-[var(--color-ios-blue)]/10'
                        : 'border-[var(--color-separator)] glass'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span className="text-sm font-semibold">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-3 glass rounded-2xl text-[var(--color-text)] font-semibold border border-[var(--color-separator)]/30"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectPaymentMethod}
                disabled={!selectedPackage}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - Card */}
      {showPaymentModal && selectedPackage && paymentMethod === "CARD" && (
        <PaymentModal
          selectedPackage={selectedPackage}
          paymentMethod={paymentMethod}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment Modal - Kaspi */}
      {showPaymentModal && selectedPackage && paymentMethod === "KASPI" && (
        <KaspiPaymentModal
          selectedPackage={selectedPackage}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default Wallet;
