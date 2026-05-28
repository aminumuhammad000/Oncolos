import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, TrendingUp, ArrowDownCircle,
  Settings, LogOut, ChevronRight, CheckCircle, XCircle,
  CreditCard, Shield, Key, Bell, Search, MoreVertical, Mail, Gift, Crown, Megaphone,
  Plus, Minus, Wallet, Eye, Trash2, LogIn, Lock, EyeOff
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
  const [platformSettings, setPlatformSettings] = useState({ isDailyBonusEnabled: true, isWelcomeBonusEnabled: true, welcomeBonusAmount: 600, isWithdrawalEnabled: true, withdrawalFeePercent: 15 });
  const [gateway, setGateway] = useState({ provider: 'VTStack (Recommended)', mode: 'test', publicKey: '', payoutKey: '', webhookSecret: '' });
  const [emailSettings, setEmailSettings] = useState({ smtpEmail: '', appPassword: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [balanceModal, setBalanceModal] = useState(null); // { userId, userName, action: 'add'|'deduct' }
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [promoModal, setPromoModal] = useState(null); // { id, title, description, type, isActive }
  const [promoForm, setPromoForm] = useState({ title: '', description: '', type: 'News', isActive: true, imageUrl: '', link: '' });

  const [stats, setStats] = useState({ totalUsers: 0, activeInvestments: 0, totalBalance: 0, pendingWithdrawals: 0 });
  const [users, setUsers] = useState([]);
  const [vipUsers, setVipUsers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterKYC, setFilterKYC] = useState('All');
  const [passModal, setPassModal] = useState(null); // { userId, userName }
  const [showPass, setShowPass] = useState(false);

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

  const safeJson = async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error(`Server error (${res.status}): unexpected response format`);
    }
    return res.json();
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('oncolos_admin_token');
    if (!token) return setView('login');

    try {
      if (section === 'dashboard') {
        const res = await fetch(`${API_BASE}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) {
          setStats(data.data);
          if (data.data.recentUsers) setUsers(data.data.recentUsers);
          if (data.data.pendingWithdrawals) setWithdrawals(data.data.pendingWithdrawals);
        }
      }
      if (section === 'users') {
        const res = await fetch(`${API_BASE}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) setUsers(data.data);
      }
      if (section === 'investments') {
        const res = await fetch(`${API_BASE}/investments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) setInvestments(data.data);
      }
      if (section === 'referrals') {
        const res = await fetch(`${API_BASE}/referrals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) setReferrals(data.data);
      }
      if (section === 'withdrawals') {
        const res = await fetch(`${API_BASE}/withdrawals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) setWithdrawals(data.data);
      }
      if (section === 'deposits') {
        const res = await fetch(`${API_BASE}/deposits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) setDeposits(data.data);
      }
      if (section === 'settings') {
        const res = await fetch(`${API_BASE}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) setPlatformSettings(data.data);
      }
      if (section === 'vip') {
        const res = await fetch(`${API_BASE}/vip`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) setVipUsers(data.data);
      }
      if (section === 'promo') {
        const res = await fetch(`${API_BASE}/promotions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await safeJson(res);
        if (data.success) setPromotions(data.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVIP = async (userId, vipLevel) => {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/vip`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oncolos_admin_token')}`
        },
        body: JSON.stringify({ vipLevel: Number(vipLevel) })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, vipLevel: Number(vipLevel) } : u));
        setVipUsers(prev => prev.map(u => u._id === userId ? { ...u, vipLevel: Number(vipLevel) } : u));
        alert('VIP level updated!');
      }
    } catch (err) {
      console.error('Failed to update VIP:', err);
      alert('Error updating VIP');
    }
  };

  const handlePromoAction = async (method, id = null, body = null) => {
    try {
      const url = id ? `${API_BASE}/promotions/${id}` : `${API_BASE}/promotions`;
      const res = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oncolos_admin_token')}`
        },
        body: body ? JSON.stringify(body) : null
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh promos
        if (method !== 'GET') alert('Promotion updated successfully!');
      }
    } catch (err) {
      console.error('Promo action failed:', err);
      alert('Error updating promotion');
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
    { id: 'users',       label: 'User Management', icon: Users },
    { id: 'wallet',      label: 'Wallet Management', icon: Shield },
    { id: 'deposits',    label: 'User Payments',  icon: CreditCard },
    { id: 'withdrawals', label: 'Withdrawals',   icon: ArrowDownCircle },
    { id: 'investments', label: 'Investments',   icon: TrendingUp },
    { id: 'vip',         label: 'VIP Section',   icon: Crown },
    { id: 'promo',       label: 'Promotions',    icon: Megaphone },
    { id: 'referrals',   label: 'Referrals',     icon: ChevronRight },
    { id: 'settings',    label: 'Platform Settings', icon: Settings },
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

  const handleLoginAsUser = async (userId) => {
    try {
      const token = localStorage.getItem('oncolos_admin_token');
      const res = await fetch(`${API_BASE}/users/${userId}/login-as`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Redirect to main app with user token
        // In a real scenario, you might want to open in a new tab
        window.open(`https://oncolos.com.ng/login?token=${data.token}`, '_blank');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleChangePassword = async (userId, newPassword) => {
    try {
      const token = localStorage.getItem('oncolos_admin_token');
      const res = await fetch(`${API_BASE}/users/${userId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('Password changed successfully');
        setPassModal(null);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
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
                <StatCard label="Pending Withdrawals" value={stats.pendingWithdrawalsCount || 0} icon={ArrowDownCircle} color="#ea580c" />
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

          {/* ── Wallet Management ── */}
          {section === 'wallet' && (
            <div className="animate-in">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1.5rem'}}>
                <h1 className="page-title" style={{margin:0}}>Wallet Management</h1>
                <div className="wallet-mini-stat">
                  <Wallet size={16} />
                  <span>Total Platform Liquidity: <strong>₦{stats.totalBalance?.toLocaleString()}</strong></span>
                </div>
              </div>

              <div className="admin-card">
                <div className="wallet-header-tools">
                   <div className="search-pill">
                      <Search size={18} />
                      <input 
                        placeholder="Search user by name or phone..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                      />
                   </div>
                   <p className="muted">Directly manage user balances for corrections or bonuses.</p>
                </div>
                
                <div className="table-responsive">
                  <table className="admin-table wallet-table">
                    <thead>
                      <tr>
                        <th>User Profile</th>
                        <th>Current Balance</th>
                        <th style={{textAlign:'right'}}>Manual Adjustment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => {
                           const term = search.toLowerCase();
                           return !term || (u.name || '').toLowerCase().includes(term) || (u.phone || '').includes(term);
                        })
                        .slice(0, 20).map(u => (
                        <tr key={u._id} className="wallet-row-animate">
                          <td>
                            <div className="user-info-cell">
                               <div className="user-avatar-sm">{u.name?.charAt(0) || 'U'}</div>
                               <div>
                                  <div className="fw600">{u.name || 'User'}</div>
                                  <div className="muted" style={{fontSize:'0.75rem'}}>{u.phone}</div>
                               </div>
                            </div>
                          </td>
                          <td>
                            <div className="balance-tag">
                               ₦{u.balance?.toLocaleString()}
                            </div>
                          </td>
                          <td>
                            <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end'}}>
                              <button 
                                className="wallet-action-btn credit" 
                                onClick={() => setBalanceModal({ userId: u._id, userName: u.name || u.phone, action: 'add' })}
                                title="Credit Wallet"
                              >
                                <Plus size={18} />
                                <span>Credit</span>
                              </button>
                              <button 
                                className="wallet-action-btn deduct" 
                                onClick={() => setBalanceModal({ userId: u._id, userName: u.name || u.phone, action: 'deduct' })}
                                title="Deduct Wallet"
                              >
                                <Minus size={18} />
                                <span>Deduct</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', padding:'3rem'}} className="muted">No users found match your search.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── User Payments (Deposits) ── */}
          {section === 'deposits' && (
            <div>
              <h1 className="page-title">User Payments</h1>
              <div className="admin-card">
                 <div className="table-responsive">
                    <table className="admin-table">
                      <thead><tr><th>#</th><th>User</th><th>Amount</th><th>Reference</th><th>Channel</th><th>Date</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
                      <tbody>
                        {deposits.map((d, i) => (
                           <tr key={d._id}>
                             <td className="muted">{i+1}</td>
                             <td className="fw600">{d.user?.name || d.user?.phone || 'Unknown'}</td>
                             <td>₦{d.amount?.toLocaleString()}</td>
                             <td style={{fontSize:'0.75rem'}} className="muted">{d.reference}</td>
                             <td>{d.channel}</td>
                             <td className="muted">{new Date(d.createdAt).toLocaleDateString()}</td>
                             <td><Badge status="Completed" /></td>
                             <td>
                               <div style={{display:'flex', gap:'0.5rem', justifyContent:'flex-end'}}>
                                  <button className="action-btn approve" onClick={() => { if(d.user) setSelectedUser(d.user); }} title="View User Profile"><Eye size={14}/></button>
                               </div>
                             </td>
                           </tr>
                        ))}
                        {deposits.length === 0 && <tr><td colSpan="8" style={{textAlign:'center', padding:'2rem'}} className="muted">No payments found yet.</td></tr>}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {section === 'users' && (
            <div>
              <h1 className="page-title">All Users</h1>
              <div className="admin-card">
                <div style={{display:'flex', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap'}}>
                   <div className="search-pill" style={{maxWidth:'300px'}}>
                      <Search size={18} />
                      <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
                   </div>
                   <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                      <option value="All">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Banned">Banned</option>
                   </select>
                   <select className="filter-select" value={filterKYC} onChange={e => setFilterKYC(e.target.value)}>
                      <option value="All">All KYC</option>
                      <option value="verified">Verified</option>
                      <option value="unverified">Unverified</option>
                   </select>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                  <thead><tr><th>#</th><th>Name / Email</th><th>Phone</th><th>Balance</th><th>Joined</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
                    <tbody>
                    {users
                      .filter(u => {
                        const term = search.toLowerCase();
                        const matchesSearch = !term ||
                          (u.name || '').toLowerCase().includes(term) ||
                          (u.phone || '').includes(term) ||
                          (u.email || '').toLowerCase().includes(term);
                        
                        const matchesStatus = filterStatus === 'All' || u.status === filterStatus;
                        const matchesKYC = filterKYC === 'All' || (u.kycStatus || 'unverified') === filterKYC;

                        return matchesSearch && matchesStatus && matchesKYC;
                      })
                      .map((u, i) => {
                        const label = u.name && u.name !== 'User' ? u.name : (u.email || u.phone || '—');
                        return (
                          <tr key={u._id}>
                            <td className="muted">{i + 1}</td>
                            <td>
                               <div className="user-info-cell">
                                  <div className="fw600">{label}</div>
                                  {u.email && <div className="muted" style={{fontSize:'0.7rem'}}>{u.email}</div>}
                               </div>
                            </td>
                            <td>{u.phone || '—'}</td>
                            <td>₦{(u.balance || 0).toLocaleString()}</td>
                            <td className="muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td><Badge status={u.status || 'Active'} /></td>
                            <td>
                               <div style={{display:'flex', gap:'0.5rem', justifyContent:'flex-end'}}>
                                  <button className="action-btn approve" onClick={() => setSelectedUser(u)} title="View Profile"><Eye size={14}/></button>
                                  <button className="action-btn reject" onClick={() => { if(window.confirm(`Permanently delete ${label}?`)) handleDeleteUser(u._id); }} title="Delete User"><Trash2 size={14}/></button>
                               </div>
                            </td>
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
                    <thead><tr><th>User</th><th>Plan Price</th><th>Daily Income</th><th>Days Left</th><th>Earned</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
                    <tbody>
                      {investments.map(inv => (
                      <tr key={inv._id}>
                        <td>
                           <div className="user-info-cell">
                              <div className="user-avatar-sm" style={{background:'#eff6ff', color:'#2563eb'}}><TrendingUp size={14}/></div>
                              <div>
                                 <div className="fw600">{inv.user?.name || 'Unknown'}</div>
                                 <div className="muted" style={{fontSize:'0.7rem'}}>{inv.user?.phone}</div>
                              </div>
                           </div>
                        </td>
                        <td>₦{inv.planPrice?.toLocaleString()}</td>
                        <td>₦{inv.dailyIncome?.toLocaleString()}</td>
                        <td className="muted">{60 - inv.daysElapsed} days</td>
                        <td className="fw600">₦{inv.earned?.toLocaleString()}</td>
                        <td><Badge status={inv.status} /></td>
                        <td>
                           <div style={{display:'flex', gap:'0.5rem', justifyContent:'flex-end'}}>
                              <button className="action-btn approve" onClick={() => setSelectedInvestment(inv)} title="View Investment Details"><Eye size={14}/></button>
                           </div>
                        </td>
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
                            <div style={{display:'flex', gap:'0.5rem'}}>
                               <button className="action-btn approve" style={{background:'#f1f5f9', color:'#475569'}} onClick={() => { if(w.user) setSelectedUser(w.user); }} title="View User Profile"><Eye size={14}/></button>
                               {w.status === 'Pending' ? (
                                  <>
                                    <button className="action-btn approve" onClick={() => handleWithdrawalStatus(w._id, 'Approved')} title="Approve Withdrawal"><CheckCircle size={14}/></button>
                                    <button className="action-btn reject"  onClick={() => handleWithdrawalStatus(w._id, 'Rejected')} title="Reject Withdrawal"><XCircle size={14}/></button>
                                  </>
                               ) : <span className="muted">Processed</span>}
                            </div>
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

          {/* ── VIP Section ── */}
          {section === 'vip' && (
            <div>
              <h1 className="page-title">VIP Management</h1>
              <div className="admin-card">
                 <div className="table-responsive">
                    <table className="admin-table">
                      <thead><tr><th>User</th><th>Phone</th><th>Balance</th><th>VIP Level</th><th>Actions</th></tr></thead>
                      <tbody>
                        {users
                          .filter(u => {
                             const term = search.toLowerCase();
                             return !term || (u.name || '').toLowerCase().includes(term) || (u.phone || '').includes(term);
                          })
                          .slice(0, 50).map(u => (
                          <tr key={u._id}>
                            <td className="fw600">{u.name || u.phone}</td>
                            <td>{u.phone}</td>
                            <td>₦{u.balance?.toLocaleString()}</td>
                            <td>
                              <select 
                                value={u.vipLevel || 0} 
                                onChange={(e) => handleUpdateVIP(u._id, e.target.value)}
                                style={{padding:'4px 8px', borderRadius:'6px', border:'1px solid #ddd'}}
                              >
                                {[0,1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>VIP {v}</option>)}
                              </select>
                            </td>
                            <td>
                              <Badge status={u.vipLevel > 0 ? 'Verified' : 'Regular'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}

          {/* ── Promotions Section ── */}
          {section === 'promo' && (
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '2rem'}}>
                <h1 className="page-title" style={{margin:0}}>Promotions & News</h1>
                <button className="admin-btn-primary" onClick={() => { setPromoForm({ title: '', description: '', type: 'News', isActive: true, imageUrl: '', link: '' }); setPromoModal('new'); }}>+ New Promotion</button>
              </div>
              
              <div className="admin-card">
                 <div className="table-responsive">
                    <table className="admin-table">
                      <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                      <tbody>
                        {promotions.map(p => (
                           <tr key={p._id}>
                             <td className="fw600">{p.title}</td>
                             <td><Badge status={p.type} /></td>
                             <td>{p.isActive ? '🟢 Active' : '🔴 Inactive'}</td>
                             <td className="muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                             <td>
                               <div style={{display:'flex', gap:'0.5rem'}}>
                                 <button className="action-btn approve" onClick={() => { setPromoForm(p); setPromoModal(p._id); }}><Settings size={14}/></button>
                                 <button className="action-btn reject" onClick={() => { if(window.confirm('Delete promo?')) handlePromoAction('DELETE', p._id); }}><XCircle size={14}/></button>
                               </div>
                             </td>
                           </tr>
                        ))}
                        {promotions.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}} className="muted">No promotions found.</td></tr>}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── User Detail Modal ── */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" style={{maxWidth: '650px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                 <div className="admin-avatar" style={{width:40, height:40}}>{selectedUser.name?.charAt(0) || 'U'}</div>
                 <div>
                    <h2 style={{margin:0}}>{selectedUser.name || 'User Profile'}</h2>
                    <p className="muted" style={{fontSize:'0.75rem'}}>User ID: {selectedUser._id}</p>
                 </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="modal-body-content">
              <div className="dash-grid-2">
                 <div className="detail-section">
                    <h3>Identification</h3>
                    <div className="detail-row"><span>Full Name</span><strong>{selectedUser.name}</strong></div>
                    <div className="detail-row"><span>Phone</span><strong>{selectedUser.phone}</strong></div>
                    <div className="detail-row"><span>Email</span><strong>{selectedUser.email || '--'}</strong></div>
                    <div className="detail-row"><span>BVN</span><strong>{selectedUser.bvn || 'Not provided'}</strong></div>
                    <div className="detail-row"><span>KYC Status</span><Badge status={selectedUser.kycStatus || 'unverified'} /></div>
                 </div>
                 <div className="detail-section">
                    <h3>Account Info</h3>
                    <div className="detail-row"><span>Status</span><Badge status={selectedUser.status} /></div>
                    <div className="detail-row"><span>Joined</span><strong>{new Date(selectedUser.createdAt).toLocaleDateString()}</strong></div>
                    <div className="detail-row"><span>Balance</span><strong>₦{(selectedUser.balance || 0).toLocaleString()}</strong></div>
                    <div className="detail-row"><span>VIP Level</span><strong>VIP {selectedUser.vipLevel || 0}</strong></div>
                    <div className="detail-row"><span>Referral Code</span><strong style={{color:'var(--primary)'}}>{selectedUser.referralCode}</strong></div>
                 </div>
              </div>

              <div className="detail-section" style={{marginTop: '0.5rem'}}>
                <h3>Security & Access</h3>
                <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap'}}>
                   <button className="action-btn approve" style={{padding:'0.6rem 1rem'}} onClick={() => handleLoginAsUser(selectedUser._id)}>
                     <LogIn size={16}/> Login as User
                   </button>
                   <button className="action-btn reject" style={{padding:'0.6rem 1rem', background:'#f1f5f9', color:'#475569'}} onClick={() => setPassModal({ userId: selectedUser._id, userName: selectedUser.name })}>
                     <Lock size={16}/> Change Password
                   </button>
                </div>
              </div>

              <div className="modal-actions-admin" style={{marginTop: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'}}>
                  <button className="admin-btn-secondary" onClick={() => handleUpdateKYC(selectedUser._id, 'verified')}>Approve KYC</button>
                  <button className="admin-btn-primary" style={{background: '#16a34a'}} onClick={() => handleAdjustBalance(selectedUser._id, selectedUser.name || selectedUser.phone)}>💳 Credit Wallet</button>
                  <button className="admin-btn-primary" style={{background: '#dc2626'}} onClick={() => { setBalanceModal({ userId: selectedUser._id, userName: selectedUser.name || selectedUser.phone, action: 'deduct' }); setBalanceAmount(''); }}>Deduct Wallet</button>
                  {selectedUser.status === 'Banned' ? (
                    <button className="admin-btn-secondary" style={{borderColor: '#16a34a', color: '#16a34a'}} onClick={() => handleUpdateStatus(selectedUser._id, 'Active')}>Unban User</button>
                  ) : (
                    <button className="admin-btn-secondary" style={{borderColor: '#dc2626', color: '#dc2626'}} onClick={() => handleUpdateStatus(selectedUser._id, 'Banned')}>Ban User</button>
                  )}
                  <button className="admin-btn-secondary" style={{background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca'}} onClick={() => { if(window.confirm('Delete user permanently?')) handleDeleteUser(selectedUser._id); }}>Delete User</button>
              </div>
              
              <div style={{marginTop:'1.5rem', textAlign:'center'}}>
                 <button className="muted" style={{background:'none', border:'none', cursor:'pointer', textDecoration:'underline'}} onClick={() => setSelectedUser(null)}>Close Window</button>
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
                <div className="detail-row"><span>Investor</span><strong>{selectedInvestment.user?.name || selectedInvestment.user?.phone || 'Unknown'}</strong></div>
                <div className="detail-row"><span>Plan</span><strong>{selectedInvestment.planName || selectedInvestment.plan || '—'}</strong></div>
                <div className="detail-row"><span>Plan Price</span><strong>₦{(selectedInvestment.planPrice || 0)?.toLocaleString()}</strong></div>
                <div className="detail-row"><span>Daily Income</span><strong>₦{(selectedInvestment.dailyIncome || selectedInvestment.daily || 0)?.toLocaleString()}</strong></div>
              </div>
              <div className="detail-section">
                <h3>Progress</h3>
                <div className="detail-row"><span>Days Elapsed</span><strong>{selectedInvestment.daysElapsed || 0} / 60</strong></div>
                <div className="detail-row"><span>Days Remaining</span><strong>{60 - (selectedInvestment.daysElapsed || 0)}</strong></div>
                <div className="detail-row"><span>Total Earned</span><strong>₦{(selectedInvestment.totalEarned ?? selectedInvestment.earned ?? 0)?.toLocaleString()}</strong></div>
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

      {/* ── Promotion Modal ── */}
      {promoModal && (
        <div className="admin-modal-overlay" onClick={() => setPromoModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '650px'}}>
            <div className="modal-header">
              <h2>{promoModal === 'new' ? 'Add Promotion' : 'Edit Promotion'}</h2>
              <button className="close-btn" onClick={() => setPromoModal(null)}>×</button>
            </div>
            <div className="modal-body-content">
               <div className="form-group">
                 <label>Title</label>
                 <input type="text" value={promoForm.title} onChange={e => setPromoForm({...promoForm, title: e.target.value})} placeholder="e.g. 50% Bonus Weekend" />
               </div>
               <div className="form-group">
                 <label>Description / Content</label>
                 <textarea value={promoForm.description} onChange={e => setPromoForm({...promoForm, description: e.target.value})} style={{width:'100%', height:'100px', padding:'10px', borderRadius:'8px', border:'1px solid #ddd'}} placeholder="Promo details..." />
               </div>
               <div className="form-group">
                 <label>Type</label>
                 <select value={promoForm.type} onChange={e => setPromoForm({...promoForm, type: e.target.value})}>
                   <option value="News">News</option>
                   <option value="Banner">Banner</option>
                   <option value="Popup">Popup</option>
                 </select>
               </div>
               <div className="form-group">
                 <label>Image URL (optional)</label>
                 <input type="text" value={promoForm.imageUrl} onChange={e => setPromoForm({...promoForm, imageUrl: e.target.value})} placeholder="https://..." />
               </div>
               <div className="form-group">
                 <label>Target Link (optional)</label>
                 <input type="text" value={promoForm.link} onChange={e => setPromoForm({...promoForm, link: e.target.value})} placeholder="/offers" />
               </div>
               <label className="toggle-row" style={{marginTop:'1.5rem'}}>
                  <span>Is Active</span>
                  <input type="checkbox" checked={promoForm.isActive} onChange={e => setPromoForm({...promoForm, isActive: e.target.checked})} />
               </label>

               <div className="modal-actions-admin" style={{marginTop:'2rem'}}>
                 <button className="admin-btn-secondary" onClick={() => setPromoModal(null)}>Cancel</button>
                 <button className="admin-btn-primary" onClick={() => handlePromoAction(promoModal === 'new' ? 'POST' : 'PUT', promoModal === 'new' ? null : promoModal, promoForm)}>
                   {promoModal === 'new' ? 'Create Promotion' : 'Save Changes'}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
      {passModal && (
        <div className="admin-modal-overlay" onClick={() => setPassModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password: {passModal.userName}</h2>
              <button className="close-btn" onClick={() => setPassModal(null)}>×</button>
            </div>
            <div className="modal-body-content">
               <div className="form-group">
                 <label>New Password</label>
                 <div style={{position:'relative'}}>
                   <input 
                     type={showPass ? 'text' : 'password'} 
                     id="admin-new-pass" 
                     placeholder="••••••••" 
                     autoFocus
                     style={{width:'100%', padding:'0.8rem', paddingRight:'3rem', borderRadius:'8px', border:'1px solid var(--border)', boxSizing:'border-box'}}
                   />
                   <button 
                     type="button"
                     onClick={() => setShowPass(!showPass)}
                     style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer'}}
                   >
                     {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                   </button>
                 </div>
               </div>
               <div className="modal-actions-admin">
                  <button className="admin-btn-secondary" onClick={() => { setPassModal(null); setShowPass(false); }}>Cancel</button>
                  <button className="admin-btn-primary" onClick={() => {
                    const pass = document.getElementById('admin-new-pass').value;
                    if(pass) handleChangePassword(passModal.userId, pass);
                  }}>Update Password</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
