import { useState, useEffect } from 'react'
import { Home, TrendingUp, Users, User, ArrowLeft, LogOut, Copy, Gift, Shield, Eye, EyeOff, Rocket, Wallet, CreditCard, Clock, Check, ArrowDownCircle, BarChart2, X, PlusCircle, ChevronRight, MessageSquare, Headset, Send, Bell, Share2, Ticket, Trash2 } from 'lucide-react'

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.')
  ? `http://${window.location.hostname}:5000/api`
  : 'https://api.oncolos.com.ng/api';

function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [platformSettings, setPlatformSettings] = useState({ isWithdrawalEnabled: true, welcomeBonusAmount: 600 });
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`https://api.oncolos.com.ng/api/admin/settings/public`);
        const data = await res.json();
        if (res.ok && data.success) setPlatformSettings(data.data);
      } catch (err) {
        console.error('Failed to fetch platform settings');
      }
    };
    const fetchPromos = async () => {
      try {
        const res = await fetch(`https://api.oncolos.com.ng/api/admin/promotions/public`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) setPromotions(data.data.filter(p => p.isActive));
        }
      } catch (err) {
        console.error('Failed to fetch promotions');
      }
    };
    fetchSettings();
    fetchPromos();
  }, []);
  const [authError, setAuthError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawForm, setWithdrawForm] = useState({ bank: '', accountNumber: '', resolvedName: '', amount: '', isResolving: false });
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [successAlert, setSuccessAlert] = useState(null);
  const [errorAlert, setErrorAlert] = useState(null);
  const [urlReferralCode, setUrlReferralCode] = useState('');
  const [realBanks, setRealBanks] = useState([]);
  const [rechargeAmount, setRechargeAmount] = useState(2500);
  const [rechargeStep, setRechargeStep] = useState('select'); // 'select' or 'pay'
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [txFilter, setTxFilter] = useState('all');
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankModalSearch, setBankModalSearch] = useState('');

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!redeemCode) return;
    setRedeemLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/redeem-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}`
        },
        body: JSON.stringify({ code: redeemCode.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessAlert({ title: 'Success!', message: data.message });
        setUser(prev => ({ ...prev, balance: data.newBalance }));
        setRedeemCode('');
        setView('dashboard');
      } else {
        throw new Error(data.message || 'Redemption failed');
      }
    } catch (err) {
      setErrorAlert({ title: 'Redeem Failed', message: err.message });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleRemoveBankAccount = async (index) => {
    if (!window.confirm('Remove this saved bank account?')) return;
    try {
      const res = await fetch(`${API_URL}/users/remove-bank/${index}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, savedBankAccounts: data.data }));
      }
    } catch (err) {
      console.error('Failed to remove bank account');
    }
  };

  const handleSaveBank = async () => {
    if (!withdrawForm.bank || !withdrawForm.accountNumber || !withdrawForm.resolvedName) return;
    try {
      const res = await fetch(`${API_URL}/users/save-bank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}`
        },
        body: JSON.stringify({
          bank: bankSearchTerm,
          bankCode: withdrawForm.bank,
          accountNumber: withdrawForm.accountNumber,
          accountName: withdrawForm.resolvedName
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessAlert({ title: 'Saved!', message: 'Bank account saved to your profile.' });
        setUser(prev => ({ ...prev, savedBankAccounts: data.data }));
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setErrorAlert({ title: 'Error', message: err.message });
    }
  };

  const hasClaimedToday = user?.lastClaimed && (new Date() - new Date(user.lastClaimed)) < (23 * 60 * 60 * 1000);

  useEffect(() => {
    const recoverSession = async () => {
      // 1. Check if admin passed a ?token= in the URL (Login as User feature)
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        // Store it so we don't lose it on refresh, then clean the URL
        localStorage.setItem('oncolos_token', urlToken);
        window.history.replaceState({}, document.title, '/');
      }

      const token = urlToken || localStorage.getItem('oncolos_token');
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data.data.user);
          setView('dashboard');
        } else {
          localStorage.removeItem('oncolos_token');
        }
      } catch (err) {
        console.error('Session recovery failed:', err);
      } finally {
        setLoading(false);
      }
    };
    recoverSession().catch(() => setLoading(false));
    if (!localStorage.getItem('oncolos_token') && !new URLSearchParams(window.location.search).get('token')) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Read referral code from URL once on mount — before session recovery changes view
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setUrlReferralCode(ref);
      // If user is not logged in, take them straight to register
      if (!localStorage.getItem('oncolos_token')) {
        setView('register');
      }
    }
  }, []); // run once on mount only


  const handleNameLookup = async (accountNumber, bankCode) => {
    if (accountNumber.length === 10 && bankCode) {
      setWithdrawForm(prev => ({ ...prev, isResolving: true, resolvedName: '' }));
      try {
        const res = await fetch(`${API_URL}/users/verify-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}`
          },
          body: JSON.stringify({ accountNumber, bankCode })
        });
        const data = await res.json();
        if (res.ok) {
          const accName = data.data?.accountName || data.data?.account_name || '';
          setWithdrawForm(prev => ({ ...prev, isResolving: false, resolvedName: accName }));
        } else {
          setWithdrawForm(prev => ({ ...prev, isResolving: false, resolvedName: '' }));
        }
      } catch (err) {
        setWithdrawForm(prev => ({ ...prev, isResolving: false, resolvedName: '' }));
      }
    } else {
      setWithdrawForm(prev => ({ ...prev, resolvedName: '' }));
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!platformSettings.isWithdrawalEnabled) {
      setErrorAlert({ title: 'Withdrawals Closed', message: 'Withdrawals are currently closed by the administrator. Please try again later.' });
      return;
    }
    if (!withdrawForm.resolvedName) {
      setErrorAlert({ title: 'Invalid Account', message: 'Please enter a valid 10-digit account number that can be verified.' });
      return;
    }
    const amount = parseFloat(withdrawForm.amount);
    if (amount < 600) {
      setErrorAlert({ title: 'Minimum Amount', message: 'Minimum withdrawal is ₦600.' });
      return;
    }
    if (amount > (user?.balance || 0)) {
      setErrorAlert({ title: 'Insufficient Funds', message: 'You do not have enough balance for this withdrawal.' });
      return;
    }

    const bankName = realBanks.find(b => b.code === withdrawForm.bank)?.name || 'the selected bank';

    try {
      const res = await fetch(`${API_URL}/users/request-withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}`
        },
        body: JSON.stringify({
          amount: amount,
          bank: bankName,
          bankCode: withdrawForm.bank,
          accountNumber: withdrawForm.accountNumber,
          accountName: withdrawForm.resolvedName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser(data.data.user);
      setSuccessAlert({
        title: 'Transaction Submitted!',
        message: `Your withdrawal of ₦${amount.toLocaleString()} is being processed. It will arrive shortly.`
      });
      setWithdrawForm({ bank: '', accountNumber: '', resolvedName: '', amount: '', isResolving: false });
      setView('dashboard');
    } catch (err) {
      setErrorAlert({ title: 'Withdrawal Failed', message: err.message });
    }
  };

  const plans = [
    { price: 2500, daily: 500 },
    { price: 6000, daily: 1000 },
    { price: 12000, daily: 2000 },
    { price: 24000, daily: 4000 },
    { price: 45000, daily: 8000 },
    { price: 90000, daily: 15000 },
    { price: 150000, daily: 25000 },
    { price: 246000, daily: 41000 },
    { price: 300000, daily: 50000 },
  ];



  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    const phone = e.target.phone.value;
    const password = e.target.password.value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('oncolos_token', data.token);
      setUser(data.data.user);
      setView('dashboard');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    const name = e.target.fullName.value;
    const phone = e.target.phone.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const referralCode = e.target.refcode?.value || null;

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, referralCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('oncolos_token', data.token);
      setUser(data.data.user);
      setView('dashboard');
      setShowWelcomeModal(true);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('oncolos_token');
    setUser(null);
    setView('login');
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      setErrorAlert({ title: 'Mismatch', message: 'New passwords do not match.' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccessAlert({ title: 'Success!', message: 'Password updated successfully.' });
      e.target.reset();
    } catch (err) {
      setErrorAlert({ title: 'Failed', message: err.message });
    }
  };

  useEffect(() => {
    if (view === 'withdraw') {
      // Always re-fetch settings when opening withdraw so admin changes are live
      const fetchSettings = async () => {
        try {
          const res = await fetch(`https://api.oncolos.com.ng/api/admin/settings/public`);
          const data = await res.json();
          if (res.ok && data.success) setPlatformSettings(data.data);
        } catch (err) {
          console.error('Failed to refresh platform settings');
        }
      };
      fetchSettings();

      if (realBanks.length === 0) {
        const fetchBanks = async () => {
          try {
            const res = await fetch(`${API_URL}/users/banks`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}` }
            });
            const data = await res.json();
            if (res.ok) {
              setRealBanks(data.data);
              // Pre-fill saved bank details if available
              if (user?.savedBankDetails?.bankCode) {
                const saved = user.savedBankDetails;
                setWithdrawForm(prev => ({
                  ...prev,
                  bank: saved.bankCode,
                  accountNumber: saved.accountNumber,
                  resolvedName: saved.accountName
                }));
                // Also set the search term for the input display
                const bankObj = data.data.find(b => b.code === saved.bankCode);
                if (bankObj) setBankSearchTerm(bankObj.name);
              }
            }
          } catch (err) {
            console.error('Failed to fetch banks');
          }
        };
        fetchBanks();
      } else if (user?.savedBankDetails?.bankCode && !withdrawForm.bank) {
        // Pre-fill if banks already loaded but form is empty
        const saved = user.savedBankDetails;
        setWithdrawForm(prev => ({
          ...prev,
          bank: saved.bankCode,
          accountNumber: saved.accountNumber,
          resolvedName: saved.accountName
        }));
        const bankObj = realBanks.find(b => b.code === saved.bankCode);
        if (bankObj) setBankSearchTerm(bankObj.name);
      }
    }
  }, [view, user]);


  const handleSignIn = async () => {
    if (hasClaimedToday) return;
    try {
      const res = await fetch(`${API_URL}/users/daily-bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser(prev => ({ ...prev, balance: data.newBalance, lastClaimed: new Date() }));
      setSuccessAlert({ title: 'Bonus Claimed!', message: data.message });
    } catch (err) {
      alert(err.message);
    }
  };

  const markMessagesAsRead = async () => {
    if (!user?.messages || user.messages.every(m => m.read)) return;
    try {
      await fetch(`${API_URL}/users/read-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}`
        }
      });
      setUser(prev => ({
        ...prev,
        messages: prev.messages.map(m => ({ ...m, read: true }))
      }));
    } catch (err) {
      console.error('Failed to mark messages as read');
    }
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    alert('Withdrawal request submitted! Minimum withdrawal is ₦600.');
  };

  const handleInvest = (plan) => {
    if ((user?.balance || 0) < plan.price) {
      alert(`Insufficient balance! You need ₦${(plan.price - (user?.balance || 0)).toLocaleString()} more.`);
      return;
    }
    setPendingPlan(plan);
    setShowModal(true);
  };

  const confirmInvestment = async () => {
    if (!pendingPlan) return;
    try {
      const res = await fetch(`${API_URL}/investments/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}`
        },
        body: JSON.stringify({
          planPrice: pendingPlan.price,
          dailyIncome: pendingPlan.daily
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser(data.data.user);
      setShowModal(false);
      setPendingPlan(null);
      setSuccessAlert({ title: '🎉 Investment Successful!', message: `Your ₦${pendingPlan.price.toLocaleString()} investment is now active. You will earn ₦${pendingPlan.daily.toLocaleString()} daily for 60 days.` });
    } catch (err) {
      setShowModal(false);
      setErrorAlert({ title: 'Investment Failed', message: err.message });
    }
  };

  return (
    <div className="app-container">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {['login', 'register', 'forgot', 'reset'].includes(view) && (
        <div className="auth-layout">
          {view === 'login' && (
            <div className="glass-card fade-in">
              <div className="auth-header">
                <h1>Welcome Back</h1>
                <p>Sign in to continue your investment journey</p>

              </div>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Phone or Email</label>
                  <input type="text" name="phone" placeholder="0812345678 or email" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {authError && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{authError}</p>}
                <button type="button" className="forgot-password" onClick={() => setView('forgot')}>
                  Forgot password?
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <div className="auth-footer">
                Don't have an account? <button onClick={() => setView('register')}>Create account</button>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="glass-card fade-in">
              <div className="auth-header">
                <h1>Create Account</h1>
                <p>Join thousands of investors today</p>

              </div>
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="fullName" placeholder="John Doe" required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" placeholder="0812345678" required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" name="email" placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Referral Code (Optional)</label>
                  <input
                    type="text"
                    name="refcode"
                    placeholder="ONC1234"
                    defaultValue={urlReferralCode}
                  />
                </div>
                {authError && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' }}>{authError}</p>}
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
              <div className="auth-footer">
                Already have an account? <button onClick={() => setView('login')}>Sign In</button>
              </div>
            </div>
          )}

          {view === 'forgot' && (
            <div className="glass-card fade-in">
              <div className="auth-header">
                <h1>Reset Password</h1>
                <p>We'll send a code to your email</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setView('reset'); }}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Send Reset Code</button>
              </form>
              <div className="auth-footer">
                <button onClick={() => setView('login')}>Back to Login</button>
              </div>
            </div>
          )}

          {view === 'reset' && (
            <div className="glass-card fade-in">
              <div className="auth-header">
                <h1>New Password</h1>
                <p>Set a new password for {resetEmail}</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); setView('login'); }}>
                <div className="form-group">
                  <label>Verification Code</label>
                  <input type="text" placeholder="6-digit code" required />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </form>
            </div>
          )}
        </div>
      )}

      {view === 'dashboard' && (
        <div className="glass-card dash-view fade-in">
          {/* Welcome Modal Popup */}
          {showWelcomeModal && (
            <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 2000 }}>
              <div className="glass-card fade-in" style={{ maxWidth: '340px', padding: '2rem', textAlign: 'center', background: 'white', color: 'var(--text-main)' }}>
                <div style={{ width: '70px', height: '70px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
                  🎁
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>Welcome to Oncolous!</h2>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Welcome to Oncolous Investment Platform, your right place to start, grow, and celebrate every step of your financial journey together.
                  <br /><br />
                  Congratulations! We've credited your account with a <strong>₦{platformSettings.welcomeBonusAmount || 600}</strong> welcome bonus to get you started.
                </p>
                <button className="btn btn-primary" onClick={() => setShowWelcomeModal(false)} style={{ width: '100%' }}>
                  Start Investing
                </button>

              </div>
            </div>
          )}

          {/* Dashboard Header - no logout here */}
          <div className="dash-header">
            <div className="user-profile clickable" onClick={() => setView('profile')}>
              <div className="avatar-circle">
                {((user?.name && user.name !== 'User') ? user.name : user?.phone).charAt(0)}
              </div>
              <div className="user-info">
                <h2>{(user?.name && user.name !== 'User') ? user.name : user?.phone}</h2>
                <p className="member-text" style={{ opacity: 0.7 }}>Member | {user?.phone}</p>
              </div>
            </div>
            <button
              className="notification-btn"
              onClick={() => setView('messages')}
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '0.6rem',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <Bell size={20} />
              {(user?.messages || []).filter(m => !m.read).length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  border: '2px solid var(--primary-dark)'
                }}>
                  {(user?.messages || []).filter(m => !m.read).length}
                </span>
              )}
            </button>
          </div>

          <div className="balance-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <p className="balance-label">Total Balance</p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '0.25rem' }}
              >
                {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="balance-amount" style={{ marginBottom: '1rem' }}>
              {showBalance ? `₦${(user?.balance || 0).toLocaleString()}` : '₦ ••••••'}
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.8rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '2px' }}>Referral Rewards</p>
              <p style={{ fontSize: '1rem', fontWeight: '700' }}>{showBalance ? `₦${(user?.referralRewards || 0).toLocaleString()}` : '₦ •••'}</p>
            </div>
          </div>

          <div style={{ height: '1rem' }}></div>

          <div className={`reward-card-premium ${hasClaimedToday ? 'claimed' : ''}`} onClick={handleSignIn}>
            <div className="reward-content">
              <div className="reward-icon-wrapper">
                <Gift size={24} />
              </div>
              <div className="reward-text">
                <h3>Daily Attendance</h3>
                <p>{hasClaimedToday ? "You've collected today's reward" : "Claim your daily ₦30 bonus"}</p>
              </div>
            </div>
            <button className="reward-action-btn">
              {hasClaimedToday ? <Check size={18} /> : "Claim"}
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>Quick Actions</div>
          <div className="quick-actions-grid">
            <button className="quick-action-item" onClick={() => setView('recharge')}>
              <div className="qa-icon" style={{ background: '#fdf2f8', color: '#db2777' }}><PlusCircle size={22} /></div>
              <span>Recharge</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('withdraw')}>
              <div className="qa-icon" style={{ background: '#eff6ff', color: '#2563eb' }}><ArrowDownCircle size={22} /></div>
              <span>Withdraw</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('earnings')}>
              <div className="qa-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}><BarChart2 size={22} /></div>
              <span>Earnings</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('stock')}>
              <div className="qa-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}><TrendingUp size={22} /></div>
              <span>My Stock</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('referral')}>
              <div className="qa-icon" style={{ background: '#fff7ed', color: '#ea580c' }}><Users size={22} /></div>
              <span>Referral</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('support')}>
              <div className="qa-icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }}><Headset size={22} /></div>
              <span>Support</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('redeem')}>
              <div className="qa-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Ticket size={22} /></div>
              <span>Redeem</span>
            </button>
          </div>




          <div className="rules-container">
            <div className="rule-chip"><Wallet size={16} /> Min Dep: ₦2,500</div>
            <div className="rule-chip"><CreditCard size={16} /> Min With: ₦600</div>
            <div className="rule-chip"><Clock size={16} /> Time: 10:30–4:30</div>
            <div className="rule-chip"><Gift size={16} /> Gift: 6pm</div>
            <div className="rule-chip rule-chip--warning"><ArrowDownCircle size={16} /> Withdrawal Charge: 15%</div>
            <div className="rule-chip rule-chip--referral"><Users size={16} /> Referral L1: 20%</div>
            <div className="rule-chip rule-chip--referral"><Users size={16} /> Referral L2: 2%</div>
            <div className="rule-chip rule-chip--referral"><Users size={16} /> Referral L3: 1%</div>
          </div>

          <div className="section-title">Investment Plans</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Active: {(user?.activeInvestments || []).length} | Packages last 60 days.
          </p>

          <div className="plans-grid">
            {plans.map((plan, index) => (
              <div key={index} className="plan-card">
                <div className="plan-price">₦{plan.price.toLocaleString()}</div>
                <div className="plan-daily">₦{plan.daily.toLocaleString()} / Day</div>
                <div className="plan-badge">60 Days</div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1rem', padding: '0.5rem', fontSize: '0.875rem' }}
                  onClick={() => handleInvest(plan)}
                >
                  Invest Now
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

      {view === 'recharge' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => rechargeStep === 'pay' ? setRechargeStep('select') : setView('dashboard')}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>

          <div className="recharge-container" style={{ padding: '0 0.5rem' }}>
            {rechargeStep === 'select' ? (
              <>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>Recharge Wallet</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Select an investment amount to add funds</p>

                <div className="recharge-amounts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                  {plans.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setRechargeAmount(p.price)}
                      style={{
                        padding: '0.875rem 0.5rem',
                        borderRadius: '12px',
                        border: rechargeAmount === p.price ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: rechargeAmount === p.price ? 'var(--primary-light)' : 'white',
                        color: rechargeAmount === p.price ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ₦{p.price.toLocaleString()}
                    </button>
                  ))}
                  <button
                    onClick={() => document.getElementById('manual-amount-input').focus()}
                    style={{
                      padding: '0.875rem 0.5rem',
                      borderRadius: '12px',
                      border: '1px dashed var(--primary)',
                      background: 'white',
                      color: 'var(--primary)',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Others
                  </button>
                </div>

                <div className="form-group">
                  <label>Manual Amount (₦)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>₦</span>
                    <input
                      id="manual-amount-input"
                      type="number"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="Enter amount"
                      style={{ paddingLeft: '2.2rem', fontSize: '1.25rem', fontWeight: '800' }}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{
                    marginTop: '2.5rem',
                    height: '56px',
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #db2777 100%)',
                    boxShadow: '0 10px 20px -5px rgba(219, 39, 119, 0.4)',
                    border: 'none'
                  }}
                  onClick={() => {
                    if (rechargeAmount < 500) { alert('Minimum recharge is ₦500'); return; }
                    setRechargeStep('pay');
                  }}
                >
                  Recharge Now
                </button>
              </>
            ) : (
              <div className="payment-step fade-in">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>Complete Payment</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Kindly transfer the exact amount to the account below</p>

                <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '24px', border: '1px dashed var(--primary)', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Amount to Pay</p>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--primary)' }}>₦{parseFloat(rechargeAmount).toLocaleString()}</h3>
                </div>

                {user?.virtualAccount?.number ? (
                  <div className="virtual-account-card recharge-va" style={{ background: 'white', boxShadow: 'none', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <div className="va-row">
                      <span>Bank Name</span>
                      <strong>{user.virtualAccount.bank}</strong>
                    </div>
                    <div className="va-row">
                      <span>Account Number</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '1.1rem' }}>{user.virtualAccount.number}</strong>
                        <button className="copy-va" onClick={() => { navigator.clipboard.writeText(user.virtualAccount.number); setSuccessAlert({ title: 'Copied!', message: 'Account number copied.' }); }}>
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="va-row">
                      <span>Beneficiary</span>
                      <strong style={{ fontSize: '0.8125rem' }}>{user.virtualAccount.name}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem', background: '#fff7ed', borderRadius: '15px', border: '1px solid #ffedd5', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: '#9a3412', marginBottom: '1rem' }}>You haven't generated a deposit account yet.</p>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.8125rem', height: '40px' }}
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_URL}/users/generate-virtual-account`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}` }
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.message);
                          setUser(prev => ({ ...prev, virtualAccount: data.virtualAccount }));
                        } catch (err) {
                          setErrorAlert({ title: 'Error', message: err.message });
                        }
                      }}
                    >
                      Generate Account Now
                    </button>
                  </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{
                      background: '#16a34a',
                      border: 'none',
                      height: '54px',
                      fontSize: '1.1rem',
                      fontWeight: '800',
                      boxShadow: '0 8px 20px -6px rgba(22, 163, 74, 0.4)'
                    }}
                    onClick={() => {
                      setView('dashboard');
                      setRechargeStep('select');
                      setSuccessAlert({
                        title: 'Payment Noted!',
                        message: 'Our system is verifying your payment. Your balance will be updated automatically within 2-5 minutes.'
                      });
                    }}
                  >
                    I Have Paid
                  </button>
                  <button
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '600' }}
                    onClick={() => setRechargeStep('select')}
                  >
                    Change Amount
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'support' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => setView('dashboard')}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>

          <div className="support-container" style={{ padding: '0 0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>Customer Support</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>Need help? Join our community or chat with us</p>

            <div className="support-links" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* WhatsApp */}
              <a
                href="https://chat.whatsapp.com/BB2589A94jY5lsnXYCT6qb"
                target="_blank"
                rel="noopener noreferrer"
                className="support-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.5rem',
                  background: '#f0fdf4',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  color: '#166534',
                  border: '1px solid #bbf7d0'
                }}
              >
                <div style={{ background: '#25d366', color: 'white', padding: '0.875rem', borderRadius: '16px' }}>
                  <MessageSquare size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.125rem' }}>WhatsApp Group</h3>
                  <p style={{ fontSize: '0.8125rem', opacity: 0.8 }}>Join our official community for updates</p>
                </div>
                <ChevronRight size={20} />
              </a>

              {/* Telegram */}
              <a
                href="https://t.me/+WxrTYkKqS9ZjYjg0"
                target="_blank"
                rel="noopener noreferrer"
                className="support-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.5rem',
                  background: '#f0f9ff',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  color: '#0369a1',
                  border: '1px solid #bae6fd'
                }}
              >
                <div style={{ background: '#0088cc', color: 'white', padding: '0.875rem', borderRadius: '16px' }}>
                  <Send size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.125rem' }}>Telegram Channel</h3>
                  <p style={{ fontSize: '0.8125rem', opacity: 0.8 }}>Get the latest news and investment tips</p>
                </div>
                <ChevronRight size={20} />
              </a>

              <div
                className="support-info-card"
                style={{
                  marginTop: '1.5rem',
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }}
              >
                <Shield size={32} color="var(--primary)" style={{ marginBottom: '0.75rem', opacity: 0.2 }} />
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Official Support Hours</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Monday - Sunday: 9:00 AM - 6:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'profile' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => setView('dashboard')}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>

          <div className="profile-container">
            <div className="profile-card">
              <div className="profile-avatar">
                {((user?.name && user.name !== 'User') ? user.name : user?.phone).charAt(0)}
              </div>
              <h2 style={{ marginBottom: '0.25rem' }}>{(user?.name && user.name !== 'User') ? user.name : user?.phone}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Official Account</p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

            <div className="change-password-section">
              <h3 className="section-title">Security</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Update your account password to ensure security.
              </p>

              <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input-wrapper">
                    <input name="currentPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-wrapper">
                    <input name="newPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Update Password
                </button>
              </form>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

            {/* Logout */}
            <button
              className="btn"
              onClick={handleLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem', fontWeight: '700', cursor: 'pointer' }}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {view === 'referral' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => setView('dashboard')}>
              ← Back to Dashboard
            </button>
          </div>

          <div className="referral-container">
            <div className="auth-header" style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <h1>Referral Program</h1>
              <p>Grow your earnings by inviting others</p>
            </div>

            <div className="rewards-grid">
              <div className="reward-card">
                <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Referral Rewards</p>
                <h2 style={{ fontSize: '2rem' }}>₦{user.referralRewards.toLocaleString()}</h2>
              </div>
            </div>

            <div className="code-card">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Your Referral Code</p>
              <span className="code-text" style={{ letterSpacing: '4px' }}>{user?.referralCode}</span>
              <button
                className="btn btn-secondary"
                onClick={() => { navigator.clipboard.writeText(user?.referralCode); setSuccessAlert({ title: 'Copied!', message: 'Referral code copied to clipboard.' }); }}
                style={{ height: '40px', fontSize: '0.875rem', gap: '8px', marginBottom: '1rem' }}
              >
                <Copy size={16} /> Copy Code
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />

              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Invitation Link</p>
              <div style={{
                background: '#fff',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                color: 'var(--text-main)',
                wordBreak: 'break-all',
                border: '1px solid var(--border)',
                marginBottom: '0.75rem',
                marginTop: '0.5rem',
                textAlign: 'left'
              }}>
                {`https://oncolos.com.ng/?ref=${user?.referralCode}`}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const link = `https://oncolos.com.ng/?ref=${user?.referralCode}`;
                  navigator.clipboard.writeText(link);
                  setSuccessAlert({ title: 'Link Copied!', message: 'Your invitation link is ready to share.' });
                }}
                style={{ height: '40px', fontSize: '0.875rem', gap: '8px' }}
              >
                <Share2 size={16} /> Copy Invitation Link
              </button>

              <div className="referral-rules" style={{ marginTop: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '15px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem' }}>Referral Rules</h4>

                <div className="rule-step" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0 }}>1</div>
                  <div>
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '0.25rem' }}>Invite Friends</h5>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Share your unique referral link or code with your friends and family via social media or messengers.</p>
                  </div>
                </div>

                <div className="rule-step" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0, justifyContent: 'center' }}>2</div>
                  <div>
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '0.25rem' }}>They Invest</h5>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>When your direct referrals (Level 1) or their referrals (Level 2 & 3) subscribe to any investment plan.</p>
                  </div>
                </div>

                <div className="rule-step" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0, justifyContent: 'center' }}>3</div>
                  <div>
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: '700', marginBottom: '0.25rem' }}>Earn Commission</h5>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>You get {platformSettings.referralL1 || 20}% from L1, {platformSettings.referralL2 || 2}% from L2, and {platformSettings.referralL3 || 1}% from L3 investments instantly.</p>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />

                <h4 style={{ fontSize: '0.9375rem', fontWeight: '800', marginBottom: '1rem' }}>Commission Rates</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Level 1 (Direct)</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)' }}>{platformSettings.referralL1 || 20}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', background: '#64748b', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Level 2 (Indirect)</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#64748b' }}>{platformSettings.referralL2 || 2}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '8px', height: '8px', background: '#94a3b8', borderRadius: '50%' }}></div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Level 3 (Indirect)</span>
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#94a3b8' }}>{platformSettings.referralL3 || 1}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-title">People You Invited ({(user?.invitedUsers || []).length})</div>
            <div className="invited-users-list">
              {(user?.invitedUsers || []).length > 0 ? (
                (user?.invitedUsers || []).map((u, i) => (
                  <div key={i} className="user-item">
                    <div>
                      <p style={{ fontWeight: '600' }}>{u.phone}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.date}</p>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: u.status === 'Active' ? '#f0fdf4' : '#fff7ed',
                      color: u.status === 'Active' ? '#166534' : '#9a3412',
                      fontWeight: '600'
                    }}>
                      {u.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No invitations yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'stock' && (
        <div className="glass-card dash-view fade-in" style={{ marginBottom: '2rem' }}>
          <div className="profile-nav">
            <button className="back-btn" onClick={() => setView('dashboard')}>
              ← Back to Dashboard
            </button>
          </div>

          <div className="stock-container">
            <div className="auth-header" style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <h1>My Investments</h1>
              <p>Current active packages</p>
            </div>

            {(user?.activeInvestments || []).length > 0 ? (
              (user?.activeInvestments || []).map((inv) => {
                const totalDays = inv.totalDays || 60;
                const daysElapsed = inv.daysElapsed || 0;
                const daysLeft = Math.max(totalDays - daysElapsed, 0);
                const progressPct = Math.min((daysElapsed / totalDays) * 100, 100);
                const isCompleted = daysLeft === 0;

                return (
                  <div key={inv._id || inv.id} className="investment-card">
                    <div className="investment-header">
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>₦{inv.planPrice.toLocaleString()} Plan</h4>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Active Package</p>
                      </div>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '99px',
                        background: isCompleted ? '#fef2f2' : '#f0fdf4',
                        color: isCompleted ? '#991b1b' : '#166534',
                        fontWeight: '700'
                      }}>
                        {isCompleted ? 'COMPLETED' : 'RUNNING'}
                      </span>
                    </div>

                    <div className="investment-stats">
                      <div className="stat-box">
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Daily Income</p>
                        <p style={{ fontWeight: '600' }}>₦{inv.dailyIncome.toLocaleString()}</p>
                      </div>
                      <div className="stat-box">
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Earned</p>
                        <p style={{ fontWeight: '600' }}>₦{(inv.earned || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${progressPct}%`, background: isCompleted ? '#ef4444' : undefined }}
                      ></div>
                    </div>

                    <div className="investment-footer">
                      <span>📅 {daysElapsed} day{daysElapsed !== 1 ? 's' : ''} elapsed</span>
                      <span>{isCompleted ? '✅ Complete' : `⏳ ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">You have no active investments.</div>
            )}
          </div>
        </div>
      )}

      {view === 'messages' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => { setView('dashboard'); markMessagesAsRead(); }}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>
          <div style={{ padding: '0 0.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>Notifications</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Updates and alerts for your account</p>

            {/* Announcements Section */}
            {promotions.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>📢 Announcements</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {promotions.map(p => (
                    <div
                      key={p._id}
                      onClick={() => p.link ? window.open(p.link, '_blank') : null}
                      style={{
                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                        border: '1px solid #bfdbfe',
                        borderLeft: '4px solid var(--primary)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        cursor: p.link ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>📢</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '700', fontSize: '0.9375rem', color: '#1e40af', marginBottom: p.description ? '0.25rem' : 0 }}>{p.title}</p>
                        {p.description && <p style={{ fontSize: '0.8125rem', color: '#3b82f6', lineHeight: '1.4' }}>{p.description}</p>}
                      </div>
                      {p.link && <ChevronRight size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Messages */}
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>🔔 Messages</h3>
            <div className="messages-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(user?.messages || []).length > 0 ? (
                [...user.messages].reverse().map((msg, i) => (
                  <div key={i} className="message-item" style={{
                    background: 'white',
                    padding: '1.25rem',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {!msg.read && <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></div>}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Bell size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem', paddingRight: '1rem' }}>{msg.title}</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '0.5rem' }}>{msg.content}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(msg.date).toLocaleDateString()} at {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                  <p>You have no messages yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Page */}
      {view === 'withdraw' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => setView('dashboard')}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>

          {!platformSettings.isWithdrawalEnabled ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔒</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.75rem', color: '#dc2626' }}>Withdrawals Temporarily Closed</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: '1.6', maxWidth: '320px', margin: '0 auto 2rem' }}>
                Our administrator has temporarily disabled withdrawals. Your funds are safe. Please check back soon.
              </p>
              <button className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={() => setView('dashboard')}>Return to Dashboard</button>
            </div>
          ) : (!user?.hasDeposited && !user?.hasInvested) ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--primary)' }}>Activation Required</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', lineHeight: '1.6', maxWidth: '320px', margin: '0 auto 2rem' }}>
                To withdraw your welcome bonus and earnings, you must first <strong>make a deposit</strong> and <strong>purchase an investment plan</strong>.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={() => setView('recharge')}>Make a Deposit</button>
                <button className="btn btn-secondary" onClick={() => setView('dashboard')}>Go to Plans</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '0 0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>Withdraw Funds</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Transfer your earnings to your bank account</p>

              {user?.savedBankAccounts?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Saved Accounts</p>
                  <div className="saved-banks-container">
                    {user.savedBankAccounts.map((acc, idx) => (
                      <div 
                        key={idx} 
                        className={`saved-bank-card ${withdrawForm.accountNumber === acc.accountNumber ? 'active' : ''}`}
                        onClick={() => {
                          setWithdrawForm(prev => ({ ...prev, bank: acc.bankCode, accountNumber: acc.accountNumber, resolvedName: acc.accountName }));
                          setBankSearchTerm(acc.bank);
                        }}
                      >
                        <button 
                          className="remove-btn"
                          onClick={(e) => { e.stopPropagation(); handleRemoveBankAccount(idx); }}
                        >
                          <Trash2 size={16} />
                        </button>
                        <h4>{acc.bank}</h4>
                        <p className="acc-num">{acc.accountNumber}</p>
                        <p className="acc-name">{acc.accountName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="platform-rules-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Min. Withdrawal</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: '800', color: 'var(--primary)' }}>₦600</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Min. Deposit</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: '800', color: 'var(--primary)' }}>₦2,500</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Withdrawal Hours</p>
                  <p style={{ fontSize: '0.9375rem', fontWeight: '800', color: '#166534' }}>10:30 AM - 04:30 PM</p>
                </div>
              </div>

              <form onSubmit={handleWithdrawSubmit}>
                <div className="form-group">
                  <label>Select Your Bank</label>
                  <div 
                    onClick={() => setShowBankModal(true)}
                    style={{ 
                      width: '100%', 
                      padding: '0.875rem 1rem', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border)', 
                      fontSize: '1rem', 
                      background: 'white', 
                      color: withdrawForm.bank ? 'var(--text-main)' : 'var(--text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {bankSearchTerm || 'Tap to choose your bank...'}
                    <ChevronRight size={18} />
                  </div>
                </div>

                {/* Bank Search Modal */}
                {showBankModal && (
                  <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="modal-content fade-in" style={{ padding: '0', overflow: 'hidden', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Select Bank</h3>
                        <button type="button" onClick={() => { setShowBankModal(false); setBankModalSearch(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                          <X size={24} />
                        </button>
                      </div>
                      
                      <div style={{ padding: '1rem' }}>
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Search bank name..."
                          value={bankModalSearch}
                          onChange={(e) => setBankModalSearch(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', outline: 'none' }}
                        />
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem 1rem' }}>
                        {realBanks
                          .filter(b => b.name.toLowerCase().includes(bankModalSearch.toLowerCase()))
                          .map((bank, bIdx) => (
                          <div 
                            key={bank.code + bIdx}
                            onClick={() => {
                              setBankSearchTerm(bank.name);
                              setWithdrawForm(prev => ({ ...prev, bank: bank.code, resolvedName: '' }));
                              setShowBankModal(false);
                              setBankModalSearch('');
                              if (withdrawForm.accountNumber?.length === 10) {
                                handleNameLookup(withdrawForm.accountNumber, bank.code);
                              }
                            }}
                            style={{ 
                              padding: '1rem', 
                              borderBottom: '1px solid #f8fafc',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'background 0.2s',
                              borderRadius: '8px'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                          >
                            <div style={{ width: '32px', height: '32px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '0.8rem', fontWeight: '800' }}>
                              {bank.name.charAt(0)}
                            </div>
                            <span style={{ fontSize: '0.9375rem', fontWeight: '600' }}>{bank.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>10-Digit Account Number</label>
                  <input
                    type="number"
                    placeholder="Enter account number"
                    value={withdrawForm.accountNumber}
                    onChange={(e) => {
                      const accountNumber = e.target.value.slice(0, 10);
                      setWithdrawForm(prev => ({ ...prev, accountNumber }));
                      handleNameLookup(accountNumber, withdrawForm.bank);
                    }}
                  />
                  {withdrawForm.isResolving && <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem' }}>Verifying account...</p>}
                  {withdrawForm.resolvedName && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bcf0da', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase', fontWeight: '700', marginBottom: '2px' }}>Recipient Name</p>
                        <p style={{ color: '#065f46', fontSize: '0.9rem', fontWeight: '800' }}>{withdrawForm.resolvedName}</p>
                      </div>
                      {!user?.savedBankAccounts?.some(a => a.accountNumber === withdrawForm.accountNumber) && (
                        <button 
                          type="button" 
                          onClick={handleSaveBank}
                          style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Save Account
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Withdrawal Amount (₦)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  
                  {/* Quick Select Amounts */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {[1000, 3000, 5000, 10000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawForm(prev => ({ ...prev, amount: amt.toString() }))}
                        style={{ 
                          padding: '0.4rem 0.75rem', 
                          borderRadius: '8px', 
                          border: `1.5px solid ${withdrawForm.amount === amt.toString() ? 'var(--primary)' : 'var(--border)'}`,
                          background: withdrawForm.amount === amt.toString() ? 'rgba(37, 99, 235, 0.05)' : 'white',
                          color: withdrawForm.amount === amt.toString() ? 'var(--primary)' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Available: ₦{(user?.balance || 0).toLocaleString()}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: '600' }}>
                      Service Fee: {platformSettings.withdrawalFeePercent || 15}% (₦{withdrawForm.amount ? (parseFloat(withdrawForm.amount) * (platformSettings.withdrawalFeePercent || 15) / 100).toLocaleString() : '0'})
                    </p>
                    {withdrawForm.amount && parseFloat(withdrawForm.amount) >= 600 && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '700', padding: '0.5rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '8px' }}>
                        You will receive: ₦{(parseFloat(withdrawForm.amount) - (parseFloat(withdrawForm.amount) * (platformSettings.withdrawalFeePercent || 15) / 100)).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '1.5rem' }}
                  disabled={!platformSettings.isWithdrawalEnabled || !withdrawForm.resolvedName || withdrawForm.isResolving || !withdrawForm.amount || parseFloat(withdrawForm.amount) < 600}
                >
                  Confirm Withdrawal
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Earnings / Transaction History Page */}
      {view === 'earnings' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => { setView('dashboard'); setTxFilter('all'); }}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>
          <div style={{ padding: '0 0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem' }}>Transaction History</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>All money in &amp; out of your wallet</p>

            {(() => {
              const OUTFLOW_TYPES = ['Plan Purchase', 'Admin Deduction'];
              const allEntries = [
                ...(user?.earningsHistory || []).map(e => ({
                  ...e,
                  category: OUTFLOW_TYPES.includes(e.type) ? 'outflow' : 'inflow'
                })),
                ...(user?.withdrawalHistory || []).map(w => ({
                  id: w._id,
                  type: 'Withdrawal',
                  amount: w.amount,
                  plan: `${w.bank} • ${w.accountNumber}`,
                  date: new Date(w.createdAt).toLocaleDateString(),
                  rawDate: w.createdAt,
                  status: w.status,
                  category: 'outflow'
                }))
              ].sort((a, b) => {
                const da = a.rawDate ? new Date(a.rawDate) : new Date(a.date);
                const db = b.rawDate ? new Date(b.rawDate) : new Date(b.date);
                return (db.getTime() || 0) - (da.getTime() || 0);
              });

              const totalInflow  = allEntries.filter(e => e.category === 'inflow').reduce((s, e) => s + (e.amount || 0), 0);
              const totalOutflow = allEntries.filter(e => e.category === 'outflow' && e.status !== 'Rejected').reduce((s, e) => s + (e.amount || 0), 0);
              const pendingCount = allEntries.filter(e => e.status === 'Pending').length;

              const filtered = txFilter === 'inflow'
                ? allEntries.filter(e => e.category === 'inflow')
                : txFilter === 'outflow'
                  ? allEntries.filter(e => e.category === 'outflow')
                  : allEntries;

              const typeConfig = {
                'Welcome Bonus':      { Icon: Gift,            bg: '#fdf2f8', col: '#db2777', label: 'Welcome Bonus' },
                'Fund Deposit':       { Icon: Wallet,          bg: '#f0fdf4', col: '#16a34a', label: 'Bank Deposit' },
                'Admin Deposit':      { Icon: Shield,          bg: '#eff6ff', col: '#2563eb', label: 'Admin Credit' },
                'Daily Reward':       { Icon: Gift,            bg: '#fef3c7', col: '#d97706', label: 'Daily Bonus' },
                'Gift Reward':        { Icon: Ticket,          bg: '#fdf4ff', col: '#9333ea', label: 'Gift Reward' },
                'Referral Bonus':     { Icon: Users,           bg: '#fff7ed', col: '#ea580c', label: 'Referral Bonus' },
                'Investment Returns': { Icon: TrendingUp,      bg: '#f0fdf4', col: '#16a34a', label: 'Investment ROI' },
                'Plan Purchase':      { Icon: CreditCard,      bg: '#fef2f2', col: '#dc2626', label: 'Plan Purchase' },
                'Admin Deduction':    { Icon: Shield,          bg: '#fef2f2', col: '#dc2626', label: 'Admin Deduction' },
                'Withdrawal':         { Icon: ArrowDownCircle, bg: '#fef2f2', col: '#dc2626', label: 'Withdrawal' },
              };

              return (
                <>
                  {/* 4-stat summary */}
                  <div className="tx-summary-grid">
                    <div className="tx-stat tx-stat--green">
                      <p>Total Inflow</p>
                      <h3>₦{totalInflow.toLocaleString()}</h3>
                    </div>
                    <div className="tx-stat tx-stat--red">
                      <p>Total Outflow</p>
                      <h3>₦{totalOutflow.toLocaleString()}</h3>
                    </div>
                    <div className="tx-stat">
                      <p>Transactions</p>
                      <h3>{allEntries.length}</h3>
                    </div>
                    <div className="tx-stat tx-stat--amber">
                      <p>Pending</p>
                      <h3>{pendingCount}</h3>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="tx-filter-tabs">
                    {[['all', '🗂 All'], ['inflow', '⬆ Inflow'], ['outflow', '⬇ Outflow']].map(([tab, label]) => (
                      <button
                        key={tab}
                        className={`tx-tab${txFilter === tab ? ' active' : ''}`}
                        onClick={() => setTxFilter(tab)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Transaction list */}
                  <div className="earnings-list">
                    {filtered.length === 0 && (
                      <div className="empty-state">No transactions found.</div>
                    )}
                    {filtered.map((entry, idx) => {
                      const cfg = typeConfig[entry.type] || { Icon: BarChart2, bg: '#f1f5f9', col: '#64748b', label: entry.type };
                      const { Icon: IconComp } = cfg;
                      const isOutflow  = entry.category === 'outflow';
                      const isRejected = entry.status === 'Rejected';
                      const amtColor   = isRejected ? '#94a3b8' : isOutflow ? '#dc2626' : '#16a34a';
                      const sign       = isRejected ? '' : isOutflow ? '−' : '+';

                      return (
                        <div key={entry.id || idx} className="earning-item">
                          <div className="earning-icon-wrap" style={{ background: cfg.bg, color: cfg.col }}>
                            <IconComp size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '2px' }}>{cfg.label}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {entry.plan}
                            </p>
                            <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>{entry.date}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontWeight: '800', fontSize: '0.95rem', color: amtColor }}>
                              {sign}₦{(entry.amount || 0).toLocaleString()}
                            </p>
                            <span className={`earn-badge ${(entry.status || '').toLowerCase()}`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}


      {/* Redeem Page */}
      {view === 'redeem' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => setView('dashboard')}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>
          <div style={{ padding: '0 0.5rem', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              transform: 'rotate(-10deg)',
              boxShadow: '0 10px 20px rgba(99, 102, 241, 0.1)'
            }}>
              <Ticket size={40} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>Gift Code</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              Enter your official Oncolos gift code below to claim your special bonus reward.
            </p>

            <form onSubmit={handleRedeem} style={{ maxWidth: '300px', margin: '0 auto' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="ENTER GIFT CODE"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    height: '60px',
                    borderRadius: '15px',
                    border: '2px solid var(--border)',
                    background: '#f8fafc'
                  }}
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ height: '55px', fontSize: '1rem', fontWeight: '700' }}
                disabled={redeemLoading || !redeemCode}
              >
                {redeemLoading ? 'Verifying Code...' : 'Redeem Reward'}
              </button>
            </form>

            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                <Gift size={20} color="var(--primary)" />
                <h4 style={{ color: 'var(--text-main)', fontWeight: '800' }}>Active Gift Rewards</h4>
              </div>

              {promotions.filter(p => !p.type || p.type === 'Banner' || p.type === 'News').filter(p => p.promoCode).length > 0 ? (
                promotions.filter(p => !p.type || p.type === 'Banner' || p.type === 'News').filter(p => p.promoCode).map((p, i) => (
                  <div key={i} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--border)', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h5 style={{ fontWeight: '800', fontSize: '0.9375rem', marginBottom: '0.125rem' }}>{p.title}</h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: '800', color: 'var(--primary)' }}>₦{p.bonusAmount?.toLocaleString()}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', justifyContent: 'flex-end' }}>
                          <code style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#475569', fontWeight: '800', letterSpacing: '1px' }}>{p.promoCode}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(p.promoCode);
                              setSuccessAlert({ title: 'Copied!', message: 'Gift code copied to clipboard.' });
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.25rem', background: '#f0f9ff', borderRadius: '15px', border: '1px solid #bae6fd' }}>
                  <p style={{ fontSize: '0.8125rem', color: '#0c4a6e', lineHeight: '1.6' }}>
                    Codes are shared daily on our official Telegram channel and during special community events. Make sure you follow us to stay updated!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      {['dashboard', 'profile', 'referral', 'stock', 'withdraw', 'earnings', 'redeem', 'recharge', 'support'].includes(view) && (
        <nav className="bottom-nav">
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
            <Home size={22} className="nav-icon" />
            <span>Home</span>
          </button>
          <button className={`nav-item ${view === 'stock' ? 'active' : ''}`} onClick={() => setView('stock')}>
            <TrendingUp size={22} className="nav-icon" />
            <span>Stock</span>
          </button>
          <button className={`nav-item ${view === 'referral' ? 'active' : ''}`} onClick={() => setView('referral')}>
            <Users size={22} className="nav-icon" />
            <span>Refer</span>
          </button>
          <button className={`nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>
            <User size={22} className="nav-icon" />
            <span>Profile</span>
          </button>
        </nav>
      )}

      {/* Modern Investment Confirmation Modal */}
      {showModal && pendingPlan && (
        <div className="modern-alert-overlay fade-in">
          <div className="modern-alert slide-up" style={{ maxWidth: '360px' }}>
            <div className="alert-icon-circle" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}>
              <Shield size={32} />
            </div>
            <h2>Confirm Investment</h2>
            <div style={{
              background: '#f8fafc',
              padding: '1.25rem',
              borderRadius: '20px',
              marginBottom: '1.5rem',
              border: '1px solid var(--border)'
            }}>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>You are subscribing to</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem' }}>₦{pendingPlan.price.toLocaleString()} Plan</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                <span>Daily: ₦{pendingPlan.daily.toLocaleString()}</span>
                <span>•</span>
                <span>Term: 60 Days</span>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, height: '50px' }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmInvestment} style={{ flex: 2, height: '50px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none' }}>
                Approve & Pay
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modern Alert Modal */}
      {successAlert && (
        <div className="modern-alert-overlay fade-in">
          <div className="modern-alert slide-up">
            <div className="alert-icon-circle">
              <Check size={32} />
            </div>
            <h2>{successAlert.title}</h2>
            <p>{successAlert.message}</p>
            <button className="btn btn-primary" onClick={() => setSuccessAlert(null)}>Great!</button>
          </div>
        </div>
      )}
      {/* Error Alert Modal */}
      {errorAlert && (
        <div className="modern-alert-overlay fade-in">
          <div className="modern-alert slide-up" style={{ borderTop: '4px solid #dc2626' }}>
            <div className="alert-icon-circle" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
              <X size={32} />
            </div>
            <h2>{errorAlert.title}</h2>
            <p>{errorAlert.message}</p>
            <button className="btn btn-primary" style={{ background: '#dc2626' }} onClick={() => setErrorAlert(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
