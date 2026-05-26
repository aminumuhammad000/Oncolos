import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, TrendingUp, ArrowDownCircle,
  Settings, LogOut, ChevronRight, CheckCircle, XCircle,
  CreditCard, Shield, Key, Bell, Search, MoreVertical, Mail, Gift
} from 'lucide-react'


/* ─── Stats Cards ───────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '15', color }}><Icon size={22} /></div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )
}

/* ─── Status Badge ──────────────────────────────────────── */
function Badge({ status }) {
  const map = {
    Active: { bg: '#f0fdf4', color: '#16a34a' },
    Running: { bg: '#f0fdf4', color: '#16a34a' },
    Paid: { bg: '#f0fdf4', color: '#16a34a' },
    Approved: { bg: '#f0fdf4', color: '#16a34a' },
    Completed: { bg: '#f5f3ff', color: '#7c3aed' },
    Pending: { bg: '#fffbeb', color: '#d97706' },
    Banned: { bg: '#fef2f2', color: '#dc2626' },
    Rejected: { bg: '#fef2f2', color: '#dc2626' },
    verified: { bg: '#f0fdf4', color: '#16a34a' },
    unverified: { bg: '#fef2f2', color: '#dc2626' },
    pending: { bg: '#fffbeb', color: '#d97706' },
  }
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' }
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 99 }}>
      {status}
    </span>
  )
}

/* ─── Main Admin App ────────────────────────────────────── */
export default function AdminApp() {
  const [view, setView] = useState('login');
  const [section, setSection] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [platformSettings, setPlatformSettings] = useState({ isDailyBonusEnabled: true, isWelcomeBonusEnabled: true, welcomeBonusAmount: 600, isWithdrawalEnabled: true, withdrawalFee: 50 });
  const [gateway, setGateway] = useState({ provider: 'VTStack (Recommended)', mode: 'test', publicKey: '', payoutKey: '', webhookSecret: '' });
  const [emailSettings, setEmailSettings] = useState({ smtpEmail: '', appPassword: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [balanceModal, setBalanceModal] = useState(null); // { userId, userName, action: 'add'|'deduct' }
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [stats, setStats] = useState({ totalUsers: 0, activeInvestments: 0, totalBalance: 0, pendingWithdrawals: 0 });
  const [users, setUsers] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'https://api.oncolos.com.ng/api/admin';

  useEffect(() => {
    const token = localStorage.getItem('oncolos_admin_token');
    if (token) {
      setView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (view === 'dashboard') {
      fetchData();
    }
  }, [section, view]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('oncolos_admin_token');
    if (!token) return setView('login');

    try {
      if (section === 'dashboard') {
        const res = await fetch(`${API_BASE}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setStats(data.data);
      }
      if (section === 'users') {
        const res = await fetch(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setUsers(data.data);
      }
      if (section === 'investments') {
        const res = await fetch(`${API_BASE}/investments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setInvestments(data.data);
      }
      if (section === 'referrals') {
        const res = await fetch(`${API_BASE}/referrals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setReferrals(data.data);
      }
      if (section === 'withdrawals') {
        const res = await fetch(`${API_BASE}/withdrawals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setWithdrawals(data.data);
      }
      if (section === 'settings') {
        const res = await fetch(`${API_BASE}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setPlatformSettings(data.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalStatus = async (id, status) => {
    try {
      setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status } : w));
      await fetch(`${API_BASE}/withdrawals/${id}/status`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oncolos_admin_token')}`
        },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error('Failed to update withdrawal:', err);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      setPlatformSettings({ ...platformSettings, [key]: value });
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oncolos_admin_token')}`
        },
        body: JSON.stringify({ key, value })
      });
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const handleUpdateKYC = async (userId, kycStatus) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/kyc`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oncolos_admin_token')}`
        },
        body: JSON.stringify({ kycStatus })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, kycStatus } : u));
        setSelectedUser(prev => prev ? { ...prev, kycStatus } : null);
        alert('KYC status updated!');
      }
    } catch (err) {
      console.error('Failed to update KYC:', err);
      alert('Error updating KYC');
    }
  };

  const handleAdjustBalance = (userId, userName) => {
    setBalanceAmount('');
    setBalanceModal({ userId, userName, action: 'add' });
  };

  const submitBalanceUpdate = async () => {
    if (!balanceAmount || isNaN(balanceAmount) || Number(balanceAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    setBalanceLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${balanceModal.userId}/balance`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oncolos_admin_token')}`
        },
        body: JSON.stringify({ amount: Number(balanceAmount), action: balanceModal.action })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u._id === balanceModal.userId ? { ...u, balance: data.newBalance } : u));
        setSelectedUser(prev => prev ? { ...prev, balance: data.newBalance } : null);
        setBalanceModal(null);
        setBalanceAmount('');
        alert(`✅ Wallet ${balanceModal.action === 'add' ? 'credited' : 'debited'} successfully! New balance: ₦${data.newBalance.toLocaleString()}`);
      } else {
        alert(data.message || 'Failed to update balance');
      }
    } catch (err) {
      console.error('Failed to update balance:', err);
      alert('Error updating balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/status`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oncolos_admin_token')}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, status } : u));
        setSelectedUser(prev => prev ? { ...prev, status } : null);
        alert(`User status updated to ${status}!`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Error updating status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('ARE YOU SURE? This will permanently delete the user and all their investments/withdrawals. This cannot be undone.')) return;
    
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('oncolos_admin_token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        setSelectedUser(null);
        alert('User deleted successfully');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Error deleting user');
    }
  };

  const nav = [
    { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'users',       label: 'Users',         icon: Users },
    { id: 'investments', label: 'Investments',   icon: TrendingUp },
    { id: 'referrals',  label: 'Referrals',     icon: ChevronRight },
    { id: 'withdrawals', label: 'Withdrawals',   icon: ArrowDownCircle },
    { id: 'payments',    label: 'Payments',      icon: CreditCard },
    { id: 'settings',    label: 'Settings',      icon: Settings },
  ];

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const res = await fetch('https://api.oncolos.com.ng/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      if (data.data.user.role !== 'admin') {
        throw new Error('Access denied. You are not an admin.');
      }

      localStorage.setItem('oncolos_admin_token', data.token);
      setView('dashboard');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('oncolos_admin_token');
    setView('login');
  };

  if (view === 'login') {
    return (
      <div className="admin-login-layout">
        <div className="admin-login-card">
          <div className="login-header">
            <div className="shield-wrap"><Shield size={32} /></div>
            <h1>Admin Portal</h1>
            <p>Oncolos Management System</p>
          </div>
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" placeholder="admin@oncolos.com.ng" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" placeholder="••••••••" required />
            </div>
            {authError && <p className="auth-error-msg">{authError}</p>}
            <button className="admin-btn-primary" disabled={authLoading}>
              {authLoading ? 'Authenticating...' : 'Sign In to Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
            <Shield size={22} color="#2563eb" />
            {(sidebarOpen || window.innerWidth < 600) && <span>Oncolos Admin</span>}
          </div>
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <nav className="sidebar-nav">
          {nav.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${section === item.id ? 'active' : ''}`}
              onClick={() => {
                setSection(item.id);
                if (window.innerWidth < 600) setSidebarOpen(false);
              }}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <button className="sidebar-item logout-item" onClick={handleLogout}>
          <LogOut size={20} />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* ── Main ── */}
      <main className="admin-main">

        {/* Top Bar */}
        <header className="admin-topbar">
          <button className="topbar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="topbar-search">
            <Search size={16} />
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="topbar-admin">
            <div className="admin-avatar">A</div>
            <span>Super Admin</span>
          </div>
        </header>

        <div className="admin-content">

          {/* ── Dashboard ── */}
          {section === 'dashboard' && (
            <div>
              <h1 className="page-title">Overview</h1>
              <div className="stats-grid">
                <StatCard label="Total Users"       value={stats.totalUsers}        icon={Users}            color="#2563eb" />
                <StatCard label="Active Investments" value={stats.activeInvestments} icon={TrendingUp}       color="#16a34a" />
                <StatCard label="Total Balance (₦)" value={`₦${stats.totalBalance.toLocaleString()}`} icon={CreditCard} color="#7c3aed" />
                <StatCard label="Pending Withdrawals" value={stats.pendingWithdrawals} icon={ArrowDownCircle} color="#ea580c" />
              </div>

              <div className="dash-grid-2">
                {/* Recent Users */}
                <div className="admin-card">
                  <h3 className="card-title">Recent Users</h3>
                  <div className="table-responsive">
                    <table className="admin-table">
                      <thead><tr><th>Name</th><th>Status</th><th>Balance</th></tr></thead>
                      <tbody>
                    {users.slice(0,5).map(u => {
                      const label = u.name && u.name !== 'User' ? u.name : (u.email || u.phone || 'Unknown');
                      return (
                        <tr key={u._id} onClick={() => setSelectedUser(u)}>
                          <td>{label}</td>
                          <td><Badge status="Active" /></td>
                          <td>₦{(u.balance || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    </tbody>
                    </table>
                  </div>
                </div>
                {/* Pending Withdrawals */}
                <div className="admin-card">
                  <h3 className="card-title">Pending Withdrawals</h3>
                      {withdrawals.filter(w => w.status === 'Pending').map(w => (
                        <div key={w._id} className="pending-row">
                          <div>
                            <p className="fw600">{w.user?.name || w.user?.email || 'User'}</p>
                            <p className="muted">{w.bank} · {w.accountNumber}</p>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <p className="fw600">₦{(w.amount || 0).toLocaleString()}</p>
                            <div style={{display:'flex', gap:'0.5rem', marginTop:'0.25rem'}}>
                              <button className="action-btn approve" onClick={() => handleWithdrawalStatus(w._id, 'Approved')}><CheckCircle size={14}/></button>
                              <button className="action-btn reject" onClick={() => handleWithdrawalStatus(w._id, 'Rejected')}><XCircle size={14}/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                  {withdrawals.filter(w=>w.status==='Pending').length === 0 && <p className="muted" style={{textAlign:'center',padding:'1rem'}}>No pending withdrawals</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {section === 'users' && (
            <div>
              <h1 className="page-title">All Users</h1>
              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                  <thead><tr><th>#</th><th>Name / Email</th><th>Phone</th><th>Email</th><th>Balance</th><th>Investments</th><th>Joined</th><th>Status</th></tr></thead>
                    <tbody>
                    {users
                      .filter(u => {
                        const term = search.toLowerCase();
                        return !term ||
                          (u.name || '').toLowerCase().includes(term) ||
                          (u.phone || '').includes(term) ||
                          (u.email || '').toLowerCase().includes(term);
                      })
                      .map((u, i) => {
                        const label = u.name && u.name !== 'User' ? u.name : (u.email || u.phone || '—');
                        return (
                          <tr key={u._id} onClick={() => setSelectedUser(u)} style={{cursor: 'pointer'}}>
                            <td className="muted">{i + 1}</td>
                            <td className="fw600">{label}</td>
                            <td>{u.phone || '—'}</td>
                            <td>{u.email || '—'}</td>
                            <td>₦{(u.balance || 0).toLocaleString()}</td>
                            <td>{(u.activeInvestments || []).length}</td>
                            <td className="muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td><Badge status={u.kycStatus || 'unverified'} /></td>
                          </tr>
                        );
                      })
                    }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Investments ── */}
          {section === 'investments' && (
            <div>
              <h1 className="page-title">Active Investments</h1>
              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>#</th><th>User</th><th>Plan</th><th>Daily Income</th><th>Days Left</th><th>Earned</th><th>Status</th></tr></thead>
                    <tbody>
                      {investments.map(inv => (
                      <tr key={inv._id} onClick={() => setSelectedInvestment(inv)} style={{cursor: 'pointer'}}>
                        <td className="muted">...</td>
                        <td className="fw600">{inv.user?.name || 'Unknown'}</td>
                        <td>₦{inv.planPrice.toLocaleString()}</td>
                        <td>₦{inv.dailyIncome.toLocaleString()}</td>
                        <td>{60 - inv.daysElapsed} days</td>
                        <td>₦{inv.earned.toLocaleString()}</td>
                        <td><Badge status={inv.status} /></td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Referrals ── */}
          {section === 'referrals' && (
            <div>
              <h1 className="page-title">Referral Tracking</h1>
              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>#</th><th>Referrer</th><th>Referee</th><th>Date</th><th>Reward</th><th>Status</th></tr></thead>
                    <tbody>
                    {referrals.map(r => (
                      <tr key={r._id}>
                        <td className="muted">...</td>
                        <td className="fw600">{r.name}</td>
                        <td>{r.phone}</td>
                        <td className="muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td>₦250</td>
                        <td><Badge status="Paid" /></td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Withdrawals ── */}
          {section === 'withdrawals' && (
            <div>
              <h1 className="page-title">Withdrawal Requests</h1>
              <div className="admin-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead><tr><th>#</th><th>User</th><th>Amount</th><th>Bank</th><th>Account</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {withdrawals.map((w, i) => (
                        <tr key={w._id}>
                          <td className="muted">{i + 1}</td>
                          <td className="fw600">{w.user?.name || w.user?.email || 'User'}</td>
                          <td>₦{(w.amount || 0).toLocaleString()}</td>
                          <td>{w.bank}</td>
                          <td className="muted">{w.accountNumber}</td>
                          <td className="muted">{new Date(w.createdAt).toLocaleDateString()}</td>
                          <td><Badge status={w.status} /></td>
                          <td>
                            {w.status === 'Pending' ? (
                              <div style={{display:'flex',gap:'0.5rem'}}>
                                <button className="action-btn approve" onClick={() => handleWithdrawalStatus(w._id, 'Approved')}><CheckCircle size={14}/> Approve</button>
                                <button className="action-btn reject"  onClick={() => handleWithdrawalStatus(w._id, 'Rejected')}><XCircle size={14}/> Reject</button>
                              </div>
                            ) : <span className="muted">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Payments Section ── */}
          {section === 'payments' && (
            <div>
              <h1 className="page-title">Payment Gateway Settings</h1>
              <div className="settings-grid">
                <div className="admin-card">
                  <div className="card-title-row">
                    <Key size={18} color="#2563eb" />
                    <h3 className="card-title">VTStack Config</h3>
                  </div>
                  <p className="muted" style={{marginBottom:'1.5rem'}}>Configure your payment provider to enable wallet funding and withdrawals.</p>

                  <div className="form-group">
                    <label>Gateway Provider</label>
                    <select value={gateway.provider} onChange={e => setGateway({...gateway, provider: e.target.value})}>
                      <option value="VTStack (Recommended)">VTStack (Recommended)</option>
                      <option value="Flutterwave" disabled>Flutterwave (Inactive)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Gateway Mode</label>
                    <select value={gateway.mode} onChange={e => setGateway({...gateway, mode: e.target.value})}>
                      <option value="test">Test (Sandbox)</option>
                      <option value="live">Live (Production)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Standard API Key (Public)</label>
                    <div className="key-input-wrapper">
                      <Key size={16} className="key-icon" />
                      <input
                        type="text"
                        placeholder={gateway.provider.includes('VTStack') ? `sk_${gateway.mode}_xxxxxxxxxxxx` : `pk_${gateway.mode}_xxxxxxxxxxxx`}
                        value={gateway.publicKey}
                        onChange={e => setGateway({...gateway, publicKey: e.target.value})}
                      />
                    </div>
                  </div>

                  {gateway.provider.includes('VTStack') && (
                    <div className="form-group">
                      <label>Payout Secret Key (Tier 3)</label>
                      <div className="key-input-wrapper">
                        <Shield size={16} className="key-icon" />
                        <input
                          type="password"
                          placeholder="vt_pout_sec_xxxxxxxxxxxx"
                          value={gateway.payoutKey || ''}
                          onChange={e => setGateway({...gateway, payoutKey: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Webhook Secret</label>
                    <div className="key-input-wrapper">
                      <Key size={16} className="key-icon" />
                      <input
                        type="password"
                        placeholder="Webhook verification secret"
                        value={gateway.webhookSecret}
                        onChange={e => setGateway({...gateway, webhookSecret: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className={`gateway-mode-badge ${gateway.mode}`}>
                    {gateway.mode === 'live' ? '🟢 Live Mode Active' : '🟡 Test / Sandbox Mode'}
                  </div>

                  <button className="admin-btn-primary" style={{marginTop:'1.5rem'}} onClick={() => alert('VTStack configuration saved!')}>
                    Save Payment Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Settings Section ── */}
          {section === 'settings' && (
            <div>
              <h1 className="page-title">Platform Settings</h1>
              <div className="settings-grid">
                {/* Email Settings */}
                <div className="admin-card">
                  <div className="card-title-row">
                    <Mail size={18} color="#7c3aed" />
                    <h3 className="card-title">Email & SMTP</h3>
                  </div>
                  <p className="muted" style={{marginBottom:'1.5rem'}}>Configure your business email for password resets and notifications.</p>

                  <div className="form-group">
                    <label>Sender Email Address</label>
                    <input 
                      type="email" 
                      placeholder="admin@oncolos.com" 
                      value={emailSettings.smtpEmail}
                      onChange={e => setEmailSettings({...emailSettings, smtpEmail: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gmail App Password</label>
                    <div className="key-input-wrapper">
                      <Key size={16} className="key-icon" />
                      <input 
                        type="password" 
                        placeholder="•••• •••• •••• ••••" 
                        value={emailSettings.appPassword}
                        onChange={e => setEmailSettings({...emailSettings, appPassword: e.target.value})}
                      />
                    </div>
                  </div>

                  <button className="admin-btn-primary" style={{marginTop:'1.5rem', background: '#7c3aed'}} onClick={() => alert('Email settings updated!')}>
                    Update SMTP Settings
                  </button>
                </div>

                {/* Platform Toggles */}
                <div className="admin-card">
                  <div className="card-title-row">
                    <Shield size={18} color="#16a34a" />
                    <h3 className="card-title">Feature Toggles</h3>
                  </div>
                  <p className="muted" style={{marginBottom:'1.5rem'}}>Enable or disable specific platform features instantly.</p>

                  <label className="toggle-row">
                    <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                       <Gift size={18} color={platformSettings.isDailyBonusEnabled ? '#16a34a' : '#64748b'} />
                       <span>Daily Sign-in Bonus</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle-checkbox" 
                      checked={platformSettings.isDailyBonusEnabled}
                      onChange={(e) => handleUpdateSetting('isDailyBonusEnabled', e.target.checked)}
                    />
                  </label>

                  <label className="toggle-row" style={{marginTop:'1.5rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                       <Gift size={18} color={platformSettings.isWelcomeBonusEnabled ? '#16a34a' : '#64748b'} />
                       <span>New User Welcome Bonus</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle-checkbox" 
                      checked={platformSettings.isWelcomeBonusEnabled}
                      onChange={(e) => handleUpdateSetting('isWelcomeBonusEnabled', e.target.checked)}
                    />
                  </label>

                  {platformSettings.isWelcomeBonusEnabled && (
                    <div className="form-group" style={{marginTop:'1rem', paddingLeft: '2.5rem'}}>
                      <label>Welcome Bonus Amount (₦)</label>
                      <input 
                        type="number" 
                        value={platformSettings.welcomeBonusAmount || 600}
                        onChange={(e) => handleUpdateSetting('welcomeBonusAmount', Number(e.target.value))}
                        placeholder="600"
                      />
                    </div>
                  )}

                  <hr style={{margin: '1.5rem 0', border: 'none', borderTop: '1px solid #eee'}} />

                  <label className="toggle-row">
                    <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                       <ArrowDownCircle size={18} color={platformSettings.isWithdrawalEnabled ? '#ef4444' : '#64748b'} />
                       <span>Enable Withdrawals</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle-checkbox" 
                      checked={platformSettings.isWithdrawalEnabled}
                      onChange={(e) => handleUpdateSetting('isWithdrawalEnabled', e.target.checked)}
                    />
                  </label>
                  <p className="muted" style={{fontSize: '0.75rem', marginTop: '0.5rem', paddingLeft: '2.5rem'}}>
                    If disabled, users will see a "Withdrawals Closed" message.
                  </p>

                  <div className="form-group" style={{marginTop: '1.5rem', paddingLeft: '2.5rem'}}>
                    <label>Withdrawal Fee (%)</label>
                    <input 
                      type="number" 
                      value={platformSettings.withdrawalFeePercent || 15}
                      onChange={(e) => handleUpdateSetting('withdrawalFeePercent', Number(e.target.value))}
                      placeholder="15"
                    />
                    <p className="muted" style={{fontSize: '0.7rem', marginTop: '0.25rem'}}>Percentage charged per withdrawal transaction.</p>
                  </div>

                  <hr style={{margin: '1.5rem 0', border: 'none', borderTop: '1px solid #eee'}} />

                  <div className="form-group" style={{paddingLeft: '2.5rem'}}>
                    <label>Referral Commission (%)</label>
                    <div style={{display:'flex', gap:'1rem', marginTop:'0.5rem'}}>
                      <div style={{flex:1}}>
                        <span style={{fontSize:'0.75rem', color:'#64748b'}}>L1 (Direct)</span>
                        <input type="number" value={platformSettings.referralL1 || 20} onChange={e => handleUpdateSetting('referralL1', Number(e.target.value))} />
                      </div>
                      <div style={{flex:1}}>
                        <span style={{fontSize:'0.75rem', color:'#64748b'}}>L2 (Indirect)</span>
                        <input type="number" value={platformSettings.referralL2 || 2} onChange={e => handleUpdateSetting('referralL2', Number(e.target.value))} />
                      </div>
                      <div style={{flex:1}}>
                        <span style={{fontSize:'0.75rem', color:'#64748b'}}>L3 (Indirect)</span>
                        <input type="number" value={platformSettings.referralL3 || 1} onChange={e => handleUpdateSetting('referralL3', Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="modal-body-content">
              <div className="detail-section">
                <div className="detail-row"><span>Full Name</span><strong>{selectedUser.name}</strong></div>
                <div className="detail-row"><span>Phone</span><strong>{selectedUser.phone}</strong></div>
                <div className="detail-row"><span>BVN</span><strong>{selectedUser.bvn || 'Not provided'}</strong></div>
                <div className="detail-row"><span>KYC Status</span><Badge status={selectedUser.kycStatus || 'unverified'} /></div>
                <div className="detail-row"><span>Status</span><Badge status={selectedUser.status} /></div>
                <div className="detail-row"><span>Joined</span><strong>{new Date(selectedUser.createdAt).toLocaleDateString()}</strong></div>
              </div>
              <div className="detail-section">
                <h3>Financials</h3>
                <div className="detail-row"><span>Available Balance</span><strong>₦{(selectedUser.balance || 0).toLocaleString()}</strong></div>
                <div className="detail-row"><span>Total Investments</span><strong>{(selectedUser.activeInvestments || []).length}</strong></div>
                <div className="detail-row"><span>Direct Referrals</span><strong>{selectedUser.referralRewards || 0}</strong></div>
              </div>
              <div className="modal-actions-admin">
                 <button className="admin-btn-secondary" onClick={() => handleUpdateKYC(selectedUser._id, 'verified')}>Approve KYC</button>
                 <button className="admin-btn-primary" style={{background: '#16a34a'}} onClick={() => handleAdjustBalance(selectedUser._id, selectedUser.name || selectedUser.phone)}>💳 Credit Wallet</button>
                 <button className="admin-btn-primary" style={{background: '#dc2626'}} onClick={() => { setBalanceModal({ userId: selectedUser._id, userName: selectedUser.name || selectedUser.phone, action: 'deduct' }); setBalanceAmount(''); }}>Deduct Wallet</button>
                 {selectedUser.status === 'Banned' ? (
                   <button className="admin-btn-secondary" style={{borderColor: '#16a34a', color: '#16a34a'}} onClick={() => handleUpdateStatus(selectedUser._id, 'Active')}>Unban User</button>
                 ) : (
                   <button className="admin-btn-secondary" style={{borderColor: '#dc2626', color: '#dc2626'}} onClick={() => handleUpdateStatus(selectedUser._id, 'Banned')}>Ban User</button>
                 )}
                 <button className="admin-btn-secondary" style={{background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'}} onClick={() => handleDeleteUser(selectedUser._id)}>Delete User</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Investment Detail Modal ── */}
      {selectedInvestment && (
        <div className="admin-modal-overlay" onClick={() => setSelectedInvestment(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Investment Profile</h2>
              <button className="close-btn" onClick={() => setSelectedInvestment(null)}>×</button>
            </div>
            <div className="modal-body-content">
              <div className="detail-section">
                <div className="detail-row"><span>Investor</span><strong>{selectedInvestment.user}</strong></div>
                <div className="detail-row"><span>Plan</span><strong>{selectedInvestment.plan}</strong></div>
                <div className="detail-row"><span>Daily Income</span><strong>₦{selectedInvestment.daily.toLocaleString()}</strong></div>
              </div>
              <div className="detail-section">
                <h3>Progress</h3>
                <div className="detail-row"><span>Days Remaining</span><strong>{selectedInvestment.daysLeft} / 60</strong></div>
                <div className="detail-row"><span>Total Earned</span><strong>₦{selectedInvestment.earned.toLocaleString()}</strong></div>
                <div className="detail-row"><span>Status</span><Badge status={selectedInvestment.status} /></div>
              </div>
              <div className="modal-actions-admin">
                 <button className="admin-btn-primary" onClick={() => setSelectedInvestment(null)}>Close View</button>
              </div>
            </div>
          </div>
        </div>
      )}\n
      {/* ── Credit/Deduct Wallet Modal ── */}
      {balanceModal && (
        <div className="admin-modal-overlay" onClick={() => setBalanceModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '400px'}}>
            <div className="modal-header">
              <h2>{balanceModal.action === 'add' ? '💳 Credit Wallet' : '💸 Deduct Wallet'}</h2>
              <button className="close-btn" onClick={() => setBalanceModal(null)}>×</button>
            </div>
            <div className="modal-body-content">
              <div className="detail-section">
                <p style={{marginBottom: '1rem', color: '#64748b'}}>User: <strong>{balanceModal.userName}</strong></p>
                <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1.25rem'}}>
                  <button 
                    onClick={() => setBalanceModal(prev => ({...prev, action: 'add'}))}
                    style={{flex: 1, padding: '0.625rem', borderRadius: '10px', border: '2px solid', borderColor: balanceModal.action === 'add' ? '#16a34a' : '#e2e8f0', background: balanceModal.action === 'add' ? '#f0fdf4' : 'white', color: balanceModal.action === 'add' ? '#16a34a' : '#64748b', fontWeight: 700, cursor: 'pointer'}}>
                    ➕ Credit
                  </button>
                  <button 
                    onClick={() => setBalanceModal(prev => ({...prev, action: 'deduct'}))}
                    style={{flex: 1, padding: '0.625rem', borderRadius: '10px', border: '2px solid', borderColor: balanceModal.action === 'deduct' ? '#dc2626' : '#e2e8f0', background: balanceModal.action === 'deduct' ? '#fef2f2' : 'white', color: balanceModal.action === 'deduct' ? '#dc2626' : '#64748b', fontWeight: 700, cursor: 'pointer'}}>
                    ➖ Deduct
                  </button>
                </div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#374151'}}>Amount (₦)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 5000"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  style={{width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', outline: 'none', boxSizing: 'border-box'}}
                  autoFocus
                />
              </div>
              <div className="modal-actions-admin">
                <button className="admin-btn-secondary" onClick={() => setBalanceModal(null)}>Cancel</button>
                <button 
                  className="admin-btn-primary" 
                  disabled={balanceLoading}
                  style={{background: balanceModal.action === 'add' ? '#16a34a' : '#dc2626'}}
                  onClick={submitBalanceUpdate}
                >
                  {balanceLoading ? 'Processing...' : balanceModal.action === 'add' ? 'Credit Wallet' : 'Deduct Wallet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
