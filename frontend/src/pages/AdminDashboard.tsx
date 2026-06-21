import React, { useState, useEffect } from "react";
import { Users, Activity, DollarSign, TrendingUp, Calendar, BarChart3, Shield, Plus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config';

interface Stats {
  dau: number;
  newUsers: number;
  messages: number;
  apps: number;
  payments: number;
  revenue: number;
  date: string;
}

interface Totals {
  users: number;
  apps: number;
  messages: number;
  revenue: number;
  onlineUsers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminNickname, setNewAdminNickname] = useState('');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/stats?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setTotals(data.totals);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/create-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newAdminUsername,
          password: newAdminPassword,
          nickname: newAdminNickname,
        }),
      });

      if (response.ok) {
        alert('Admin account created successfully!');
        setShowCreateAdmin(false);
        setNewAdminUsername('');
        setNewAdminPassword('');
        setNewAdminNickname('');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      alert('Failed to create admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-[var(--color-primary-text)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="bg-[var(--color-glass-strong)] backdrop-blur-xl border-b border-[var(--color-separator)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-[var(--color-ios-blue)]" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-[var(--color-secondary-text)]">Sparkaph Analytics</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-destructive)] text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl capitalize transition-colors ${
                period === p
                  ? 'bg-[var(--color-ios-blue)] text-white'
                  : 'bg-[var(--color-glass-medium)] text-[var(--color-primary-text)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Total Stats */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-[var(--color-ios-blue)]" />
                <span className="text-xs text-[var(--color-tertiary-text)]">Total</span>
              </div>
              <div className="text-3xl font-bold">{totals.users.toLocaleString()}</div>
              <div className="text-sm text-[var(--color-secondary-text)]">Users</div>
              <div className="text-xs text-[var(--color-success)] mt-1">
                {totals.onlineUsers} online
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-tertiary-text)]">Total</span>
              </div>
              <div className="text-3xl font-bold">{totals.apps.toLocaleString()}</div>
              <div className="text-sm text-[var(--color-secondary-text)]">Apps</div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 text-[var(--color-warning)]" />
                <span className="text-xs text-[var(--color-tertiary-text)]">Total</span>
              </div>
              <div className="text-3xl font-bold">{totals.messages.toLocaleString()}</div>
              <div className="text-sm text-[var(--color-secondary-text)]">Messages</div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-[var(--color-success)]" />
                <span className="text-xs text-[var(--color-tertiary-text)]">Total</span>
              </div>
              <div className="text-3xl font-bold">${totals.revenue.toFixed(2)}</div>
              <div className="text-sm text-[var(--color-secondary-text)]">Revenue</div>
            </div>
          </div>
        )}

        {/* Stats Chart */}
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[var(--color-ios-blue)]" />
            {period.charAt(0).toUpperCase() + period.slice(1)} Statistics
          </h2>
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.date} className="border-b border-[var(--color-separator)]/30 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--color-secondary-text)] flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date(stat.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <div className="text-xs text-[var(--color-tertiary-text)]">DAU</div>
                    <div className="text-lg font-semibold">{stat.dau.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--color-tertiary-text)]">New Users</div>
                    <div className="text-lg font-semibold">{stat.newUsers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--color-tertiary-text)]">Messages</div>
                    <div className="text-lg font-semibold">{stat.messages.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--color-tertiary-text)]">Apps</div>
                    <div className="text-lg font-semibold">{stat.apps.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--color-tertiary-text)]">Revenue</div>
                    <div className="text-lg font-semibold">${stat.revenue.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Admin Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ios-blue)] text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Create Admin
          </button>
        </div>

        {/* Create Admin Modal */}
        {showCreateAdmin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Create Admin Account</h2>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--color-secondary-text)] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--color-glass-medium)] border border-[var(--color-separator)] text-[var(--color-primary-text)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-secondary-text)] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--color-glass-medium)] border border-[var(--color-separator)] text-[var(--color-primary-text)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--color-secondary-text)] mb-1">
                    Nickname (optional)
                  </label>
                  <input
                    type="text"
                    value={newAdminNickname}
                    onChange={(e) => setNewAdminNickname(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-[var(--color-glass-medium)] border border-[var(--color-separator)] text-[var(--color-primary-text)]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[var(--color-ios-blue)] text-white rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateAdmin(false)}
                    className="flex-1 px-4 py-2 bg-[var(--color-glass-medium)] text-[var(--color-primary-text)] rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
