import { useState, useEffect } from 'react'
import { Home, TrendingUp, Users, User, ArrowLeft, LogOut, Copy, Gift, Shield, Eye, EyeOff, Rocket, Wallet, CreditCard, Clock, Check, ArrowDownCircle, BarChart2, X, PlusCircle, ChevronRight, MessageSquare, Headset, Send } from 'lucide-react'

function App() {
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawForm, setWithdrawForm] = useState({ bank: '', accountNumber: '', resolvedName: '', amount: '', isResolving: false });
  const [successAlert, setSuccessAlert] = useState(null);
  const [errorAlert, setErrorAlert] = useState(null);
  const [urlReferralCode, setUrlReferralCode] = useState('');
  const [realBanks, setRealBanks] = useState([]);
  const [rechargeAmount, setRechargeAmount] = useState(2500);
  const [rechargeStep, setRechargeStep] = useState('select'); // 'select' or 'pay'

  const hasClaimedToday = user?.lastClaimed && (new Date() - new Date(user.lastClaimed)) < (23 * 60 * 60 * 1000);

  useEffect(() => {
    const recoverSession = async () => {
      const token = localStorage.getItem('oncolos_token');
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
      }
    };
    recoverSession();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setUrlReferralCode(ref);
      if (!localStorage.getItem('oncolos_token') && view === 'login') {
        setView('register');
      }
    }
  }, [view]);


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

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    if (!withdrawForm.resolvedName) { 
        setErrorAlert({ title: 'Invalid Account', message: 'Please enter a valid 10-digit account number that can be verified.' });
        return; 
    }
    if (parseFloat(withdrawForm.amount) < 600) { 
        setErrorAlert({ title: 'Minimum Amount', message: 'Minimum withdrawal is ₦600.' });
        return; 
    }
    if (parseFloat(withdrawForm.amount) > (user?.balance || 0)) { 
        setErrorAlert({ title: 'Insufficient Funds', message: 'You do not have enough balance for this withdrawal.' });
        return; 
    }
    
    const bankName = realBanks.find(b => b.code === withdrawForm.bank)?.name || 'the selected bank';
    
    setSuccessAlert({ 
        title: 'Transaction Submitted!', 
        message: `Your withdrawal of ₦${parseFloat(withdrawForm.amount).toLocaleString()} to ${withdrawForm.resolvedName} (${bankName}) is being processed. It will arrive shortly.` 
    });
    
    setWithdrawForm({ bank: '', accountNumber: '', resolvedName: '', amount: '', isResolving: false });
    setView('dashboard');
  };

  const plans = [
    { price: 500, daily: 83 },
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

  const API_URL = 'https://api.oncolos.com.ng/api';

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
    if (view === 'withdraw' && realBanks.length === 0) {
      const fetchBanks = async () => {
        try {
          const res = await fetch(`${API_URL}/users/banks`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}` }
          });
          const data = await res.json();
          if (res.ok) {
            setRealBanks(data.data);
          }
        } catch (err) {
          console.error('Failed to fetch banks');
        }
      };
      fetchBanks();
    }
  }, [view]);

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

      setUser(prev => ({ ...prev, balance: data.newBalance, activeInvestments: [data.data, ...(prev?.activeInvestments || [])] }));
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
                <p>Access your Oncolos account</p>
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
                {authError && <p style={{color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem'}}>{authError}</p>}
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
                <p>Join the Oncolos community</p>
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
                {authError && <p style={{color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem'}}>{authError}</p>}
                <button type="submit" className="btn btn-primary" disabled={loading} style={{marginTop: '1rem'}}>
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
          {/* Dashboard Header - no logout here */}
          <div className="dash-header">
            <div className="user-profile clickable" onClick={() => setView('profile')}>
              <div className="avatar-circle">
                {((user?.name && user.name !== 'User') ? user.name : user?.phone).charAt(0)}
              </div>
              <div className="user-info">
                <h2>{(user?.name && user.name !== 'User') ? user.name : user?.phone}</h2>
                <p style={{fontSize: '0.8rem', opacity: 0.7}}>Member | {user?.phone}</p>
              </div>
            </div>
          </div>

          <div className="balance-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
              <p className="balance-label">Total Balance</p>
              <button 
                onClick={() => setShowBalance(!showBalance)} 
                style={{background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: '0.25rem'}}
              >
                {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="balance-amount" style={{marginBottom: '1rem'}}>
              {showBalance ? `₦${(user?.balance || 0).toLocaleString()}` : '₦ ••••••'}
            </p>
            <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.8rem'}}>
               <div>
                  <p style={{fontSize: '0.7rem', opacity: 0.8, marginBottom: '2px'}}>Withdrawable</p>
                  <p style={{fontSize: '1rem', fontWeight: '700'}}>{showBalance ? `₦${user.withdrawBalance.toLocaleString()}` : '₦ •••'}</p>
               </div>
               <div style={{textAlign: 'right'}}>
                  <p style={{fontSize: '0.7rem', opacity: 0.8, marginBottom: '2px'}}>Referral Rewards</p>
                  <p style={{fontSize: '1rem', fontWeight: '700'}}>{showBalance ? `₦${user.referralRewards.toLocaleString()}` : '₦ •••'}</p>
               </div>
            </div>
          </div>

          {/* Virtual Account Section */}
          {user?.virtualAccount?.number ? (
            <div className="virtual-account-card">
              <div className="va-header">
                  <h3>Deposit Account</h3>
                  <Shield size={16} color="#10b981" />
              </div>
              <div className="va-details">
                  <div className="va-row">
                      <span>Account Name</span>
                      <strong style={{textAlign: 'right'}}>{user.virtualAccount.name}</strong>
                  </div>
                  <div className="va-row">
                      <span>Account Number</span>
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <strong style={{fontSize: '1.1rem'}}>{user.virtualAccount.number}</strong>
                          <button className="copy-va" onClick={() => { navigator.clipboard.writeText(user.virtualAccount.number); setSuccessAlert({ title: 'Copied!', message: 'Account number copied to clipboard.' }); }}>
                              <Copy size={14} />
                          </button>
                      </div>
                  </div>
                  <div className="va-row">
                      <span>Bank Name</span>
                      <strong>{user.virtualAccount.bank}</strong>
                  </div>
              </div>
              <p className="va-info">Money sent to this account will be immediately credited to your wallet balance.</p>
            </div>
          ) : (
            <div className="virtual-account-card" style={{textAlign:'center', padding:'2rem 1.5rem'}}>
              <div style={{fontSize:'2.5rem', marginBottom:'0.75rem'}}>🏦</div>
              <h3 style={{marginBottom:'0.5rem', fontSize:'1rem'}}>No Deposit Account Yet</h3>
              <p style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'1.5rem'}}>Generate your personal PalmPay account to receive deposits instantly.</p>
              <button
                className="btn btn-primary"
                style={{width:'100%', padding:'0.875rem'}}
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/users/generate-virtual-account`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('oncolos_token')}` }
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message);
                    setUser(prev => ({ ...prev, virtualAccount: data.virtualAccount }));
                    setSuccessAlert({ title: '🏦 Account Created!', message: `Your PalmPay account ${data.virtualAccount.number} is ready. Send money to fund your wallet.` });
                  } catch (err) {
                    setErrorAlert({ title: 'Failed', message: err.message });
                  }
                }}
              >
                Generate Virtual Account
              </button>
            </div>
          )}

          <div style={{height: '1rem'}}></div>

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
          <div className="section-title" style={{marginBottom: '0.75rem'}}>Quick Actions</div>
          <div className="quick-actions-grid">
            <button className="quick-action-item" onClick={() => setView('recharge')}>
              <div className="qa-icon" style={{background: '#fdf2f8', color: '#db2777'}}><PlusCircle size={22} /></div>
              <span>Recharge</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('withdraw')}>
              <div className="qa-icon" style={{background: '#eff6ff', color: '#2563eb'}}><ArrowDownCircle size={22} /></div>
              <span>Withdraw</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('earnings')}>
              <div className="qa-icon" style={{background: '#f0fdf4', color: '#16a34a'}}><BarChart2 size={22} /></div>
              <span>Earnings</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('stock')}>
              <div className="qa-icon" style={{background: '#faf5ff', color: '#7c3aed'}}><TrendingUp size={22} /></div>
              <span>My Stock</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('referral')}>
              <div className="qa-icon" style={{background: '#fff7ed', color: '#ea580c'}}><Users size={22} /></div>
              <span>Referral</span>
            </button>
            <button className="quick-action-item" onClick={() => setView('support')}>
              <div className="qa-icon" style={{background: '#f0f9ff', color: '#0ea5e9'}}><Headset size={22} /></div>
              <span>Support</span>
            </button>
          </div>

          <div className="refer-banner" onClick={() => setView('referral')}>
            <div>
              <h3>Refer & Earn</h3>
              <p>Invite friends and get 10% commission</p>
            </div>
            <Rocket size={32} />
          </div>

          <div className="rules-container">
            <div className="rule-chip"><Wallet size={16} /> Min Dep: ₦2500</div>
            <div className="rule-chip"><CreditCard size={16} /> Min With: ₦600</div>
            <div className="rule-chip"><Clock size={16} /> Time: 10:30-4:30</div>
            <div className="rule-chip"><Gift size={16} /> Gift: 6pm</div>
          </div>

          <div className="section-title">Investment Plans</div>
          <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem'}}>
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
                  style={{marginTop: '1rem', padding: '0.5rem', fontSize: '0.875rem'}}
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
          
          <div className="recharge-container" style={{padding: '0 0.5rem'}}>
            {rechargeStep === 'select' ? (
                <>
                    <h1 style={{fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem'}}>Recharge Wallet</h1>
                    <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem'}}>Select an investment amount to add funds</p>

                    <div className="recharge-amounts-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2rem'}}>
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
                        <div style={{position: 'relative'}}>
                            <span style={{position: 'absolute', left: '1rem', top: '1rem', fontWeight: '700', color: 'var(--text-main)'}}>₦</span>
                            <input 
                                id="manual-amount-input"
                                type="number" 
                                value={rechargeAmount} 
                                onChange={(e) => setRechargeAmount(e.target.value)}
                                placeholder="Enter amount"
                                style={{paddingLeft: '2.2rem', fontSize: '1.25rem', fontWeight: '800'}}
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
                    <h2 style={{fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem'}}>Complete Payment</h2>
                    <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem'}}>Kindly transfer the exact amount to the account below</p>

                    <div style={{background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '24px', border: '1px dashed var(--primary)', textAlign: 'center', marginBottom: '2rem'}}>
                        <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>Amount to Pay</p>
                        <h3 style={{fontSize: '2rem', fontWeight: '900', color: 'var(--primary)'}}>₦{parseFloat(rechargeAmount).toLocaleString()}</h3>
                    </div>

                    <div className="virtual-account-card recharge-va" style={{background: 'white', boxShadow: 'none', border: '1px solid var(--border)', padding: '1.5rem'}}>
                        <div className="va-row">
                            <span>Bank Name</span>
                            <strong>{user.virtualAccount?.bank || 'Fetching...'}</strong>
                        </div>
                        <div className="va-row">
                            <span>Account Number</span>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <strong style={{fontSize: '1.1rem'}}>{user.virtualAccount?.number || '—'}</strong>
                                <button className="copy-va" onClick={() => { navigator.clipboard.writeText(user.virtualAccount.number); setSuccessAlert({ title: 'Copied!', message: 'Account number copied.' }); }}>
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="va-row">
                            <span>Beneficiary</span>
                            <strong style={{fontSize: '0.8125rem'}}>{user.virtualAccount?.name || user.name.toUpperCase()}</strong>
                        </div>
                    </div>

                    <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                        <button 
                            className="admin-btn-primary" 
                            style={{background: '#16a34a'}}
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
                            className="admin-btn-secondary" 
                            style={{border: 'none', background: 'transparent', color: 'var(--text-muted)'}}
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
          
          <div className="support-container" style={{padding: '0 0.5rem'}}>
            <h1 style={{fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem'}}>Customer Support</h1>
            <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem'}}>Need help? Join our community or chat with us</p>

            <div className="support-links" style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
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
                    <div style={{background: '#25d366', color: 'white', padding: '0.875rem', borderRadius: '16px'}}>
                        <MessageSquare size={28} />
                    </div>
                    <div style={{flex: 1}}>
                        <h3 style={{fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.125rem'}}>WhatsApp Group</h3>
                        <p style={{fontSize: '0.8125rem', opacity: 0.8}}>Join our official community for updates</p>
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
                    <div style={{background: '#0088cc', color: 'white', padding: '0.875rem', borderRadius: '16px'}}>
                        <Send size={28} />
                    </div>
                    <div style={{flex: 1}}>
                        <h3 style={{fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.125rem'}}>Telegram Channel</h3>
                        <p style={{fontSize: '0.8125rem', opacity: 0.8}}>Get the latest news and investment tips</p>
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
                    <Shield size={32} color="var(--primary)" style={{marginBottom: '0.75rem', opacity: 0.2}} />
                    <p style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem'}}>Official Support Hours</p>
                    <p style={{fontSize: '0.8125rem', color: 'var(--text-muted)'}}>Monday - Sunday: 9:00 AM - 6:00 PM</p>
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
              <h2 style={{marginBottom: '0.25rem'}}>{(user?.name && user.name !== 'User') ? user.name : user?.phone}</h2>
              <p style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>Official Account</p>
            </div>

            <hr style={{border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0'}} />

            <div className="change-password-section">
              <h3 className="section-title">Security</h3>
              <p style={{fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem'}}>
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
                <button type="submit" className="btn btn-primary" style={{marginTop: '1rem'}}>
                  Update Password
                </button>
              </form>
            </div>

            <hr style={{border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0'}} />

            {/* Logout */}
            <button 
              className="btn" 
              onClick={handleLogout} 
              style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem', fontWeight: '700', cursor: 'pointer'}}
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
            <div className="auth-header" style={{textAlign: 'left', marginBottom: '1rem'}}>
              <h1>Referral Program</h1>
              <p>Grow your earnings by inviting others</p>
            </div>

            <div className="rewards-grid">
              <div className="reward-card">
                <p style={{fontSize: '0.875rem', opacity: 0.9}}>Referral Rewards</p>
                <h2 style={{fontSize: '2rem'}}>₦{user.referralRewards.toLocaleString()}</h2>
              </div>
            </div>

            <div className="code-card">
              <p style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>Your Referral Code</p>
              <span className="code-text" style={{letterSpacing: '4px'}}>{user?.referralCode}</span>
              <button 
                className="btn btn-secondary" 
                onClick={() => {navigator.clipboard.writeText(user?.referralCode); setSuccessAlert({ title: 'Copied!', message: 'Referral code copied to clipboard.' });}} 
                style={{height: '40px', fontSize: '0.875rem', gap: '8px', marginBottom: '1rem'}}
              >
                <Copy size={16} /> Copy Code
              </button>

              <hr style={{border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0'}} />

              <p style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>Invitation Link</p>
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
                style={{height: '40px', fontSize: '0.875rem', gap: '8px'}}
              >
                <Copy size={16} /> Copy Invitation Link
              </button>
            </div>

            <div className="section-title">People You Invited ({(user?.invitedUsers || []).length})</div>
            <div className="invited-users-list">
              {(user?.invitedUsers || []).length > 0 ? (
                (user?.invitedUsers || []).map((u, i) => (
                  <div key={i} className="user-item">
                    <div>
                      <p style={{fontWeight: '600'}}>{u.phone}</p>
                      <p style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{u.date}</p>
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
        <div className="glass-card dash-view fade-in" style={{marginBottom: '2rem'}}>
          <div className="profile-nav">
                <button className="back-btn" onClick={() => setView('dashboard')}>
                ← Back to Dashboard
                </button>
            </div>
          
          <div className="stock-container">
            <div className="auth-header" style={{textAlign: 'left', marginBottom: '1rem'}}>
              <h1>My Investments</h1>
              <p>Current active packages</p>
            </div>

            {(user?.activeInvestments || []).length > 0 ? (
              (user?.activeInvestments || []).map((inv) => (
                <div key={inv.id} className="investment-card">
                  <div className="investment-header">
                    <div>
                      <h4 style={{fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)'}}>₦{inv.planPrice.toLocaleString()} Plan</h4>
                      <p style={{fontSize: '0.8125rem', color: 'var(--text-muted)'}}>Active Package</p>
                    </div>
                    <span style={{fontSize: '0.7rem', padding: '0.25rem 0.6rem', borderRadius: '99px', background: '#f0fdf4', color: '#166534', fontWeight: '700'}}>RUNNING</span>
                  </div>

                  <div className="investment-stats">
                    <div className="stat-box">
                      <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Daily Income</p>
                      <p style={{fontWeight: '600'}}>₦{inv.dailyIncome.toLocaleString()}</p>
                    </div>
                    <div className="stat-box">
                      <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>Total Earned</p>
                      <p style={{fontWeight: '600'}}>₦{inv.earned.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${(inv.daysElapsed / inv.totalDays) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="investment-footer">
                    <span>{inv.daysElapsed} days elapsed</span>
                    <span>{inv.totalDays - inv.daysElapsed} days left</span>
                  </div>
                </div>
              ))
            ) : (
                <div className="empty-state">You have no active investments.</div>
            )}
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
          <div style={{padding: '0 0.5rem'}}>
            <h1 style={{fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem'}}>Withdraw Funds</h1>
            <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem'}}>Transfer earnings to your bank account</p>

            <div className="balance-card" style={{marginBottom: '1.5rem'}}>
              <p className="balance-label">Available Balance</p>
              <p className="balance-amount">₦{(user?.balance || 0).toLocaleString()}</p>
            </div>

            <form onSubmit={handleWithdrawSubmit}>
              <div className="form-group">
                <label>Select Bank</label>
                <select 
                  value={withdrawForm.bank}
                  onChange={(e) => {
                    const bankCode = e.target.value;
                    setWithdrawForm(prev => ({ ...prev, bank: bankCode }));
                    handleNameLookup(withdrawForm.accountNumber, bankCode);
                  }}
                  required
                  style={{width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem', background: 'white', color: 'var(--text-main)', appearance: 'none'}}
                >
                  <option value="">-- Choose your bank --</option>
                  {realBanks.filter((bank, idx, arr) => arr.findIndex(b => b.code === bank.code) === idx)
                    .map((bank, idx) => <option key={`${bank.code}_${idx}`} value={bank.code}>{bank.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input 
                  type="number" 
                  placeholder="10-digit account number"
                  value={withdrawForm.accountNumber}
                  onChange={(e) => {
                    const accountNumber = e.target.value.slice(0, 10);
                    setWithdrawForm(prev => ({ ...prev, accountNumber }));
                    handleNameLookup(accountNumber, withdrawForm.bank);
                  }}
                  required
                />
              </div>

              {/* Auto-resolved account name */}
              {withdrawForm.isResolving && (
                <div className="name-resolve-box resolving">Verifying account...</div>
              )}
              {withdrawForm.resolvedName && !withdrawForm.isResolving && (
                <div className="name-resolve-box resolved">
                  <Check size={16} /> {withdrawForm.resolvedName}
                </div>
              )}

              <div className="form-group" style={{marginTop: '1rem'}}>
                <label>Amount (min ₦600)</label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{marginTop: '1.5rem'}}>
                <ArrowDownCircle size={18} /> Submit Withdrawal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Earnings Page */}
      {view === 'earnings' && (
        <div className="glass-card dash-view fade-in">
          <div className="profile-nav">
            <button className="back-btn" onClick={() => setView('dashboard')}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>
          <div style={{padding: '0 0.5rem'}}>
            <h1 style={{fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.25rem'}}>Earnings History</h1>
            <p style={{color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem'}}>All credited rewards and returns</p>

            {/* Summary */}
            <div className="earnings-summary">
              <div className="earning-stat">
                <p>Total Earned</p>
                <h3>₦{(user?.earningsHistory || []).reduce((acc, e) => acc + (e.amount || 0), 0).toLocaleString()}</h3>
              </div>
              <div className="earning-stat">
                <p>Transactions</p>
                <h3>{(user?.earningsHistory || []).length}</h3>
              </div>
            </div>

            <div className="earnings-list">
              {(user?.earningsHistory || []).map((entry) => (
                <div key={entry.id} className="earning-item">
                  <div className="earning-icon-wrap">
                    <BarChart2 size={18} />
                  </div>
                  <div style={{flex: 1}}>
                    <p style={{fontWeight: '600', fontSize: '0.9375rem'}}>{entry.type}</p>
                    <p style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{entry.plan} &bull; {entry.date}</p>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <p style={{fontWeight: '700', color: '#10b981'}}>+₦{entry.amount.toLocaleString()}</p>
                    <span className="earn-badge">{entry.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      {['dashboard', 'profile', 'referral', 'stock', 'withdraw', 'earnings'].includes(view) && (
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
          <div className="modern-alert slide-up" style={{maxWidth: '360px'}}>
            <div className="alert-icon-circle" style={{background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white'}}>
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
              <p style={{fontSize: '0.875rem', marginBottom: '0.25rem'}}>You are subscribing to</p>
              <h3 style={{fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.5rem'}}>₦{pendingPlan.price.toLocaleString()} Plan</h3>
              <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-muted)'}}>
                <span>Daily: ₦{pendingPlan.daily.toLocaleString()}</span>
                <span>•</span>
                <span>Term: 60 Days</span>
              </div>
            </div>
            
            <div className="modal-actions" style={{display: 'flex', gap: '0.75rem'}}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{flex: 1, height: '50px'}}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmInvestment} style={{flex: 2, height: '50px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none'}}>
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
          <div className="modern-alert slide-up" style={{borderTop: '4px solid #dc2626'}}>
            <div className="alert-icon-circle" style={{background: 'linear-gradient(135deg,#dc2626,#b91c1c)'}}>
              <X size={32} />
            </div>
            <h2>{errorAlert.title}</h2>
            <p>{errorAlert.message}</p>
            <button className="btn btn-primary" style={{background:'#dc2626'}} onClick={() => setErrorAlert(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App
