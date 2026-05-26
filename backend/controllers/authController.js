const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { createVirtualAccount } = require('../utils/vtstack');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, referralCode } = req.body;
    const displayName = name || phone;
    
    // Auto-generate BVN starting with 22
    const generatedBvn = '22' + Math.floor(100000000 + Math.random() * 900000000);

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this phone or email already exists' });
    }

    // Split name for VTStack
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Generate unique referral code for new user
    const userReferralCode = 'ONC' + Math.floor(1000 + Math.random() * 9000);

    const newUser = await User.create({
      name: displayName,
      phone,
      email,
      password,
      referralCode: userReferralCode,
      referredBy: referralCode || null,
      balance: 0,
      withdrawBalance: 0,
      virtualAccount: null,
      bvn: generatedBvn,
      kycStatus: 'pending'
    });

    // Link invited users for dashboard display
    if (referralCode) {
      const parent = await User.findOne({ referralCode });
      if (parent) {
        parent.invitedUsers.push({
          phone: newUser.phone,
          date: new Date().toLocaleDateString(),
          status: 'Pending' // Will become Active after first investment
        });
        await parent.save();
      }
    }

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: { user: newUser }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const identifier = req.body.phone || req.body.email || req.body.identifier;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide phone/email and password' });
    }

    const user = await User.findOne({ 
      $or: [{ phone: identifier }, { email: identifier }] 
    }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect identifier or password' });
    }

    if (user.status === 'Banned') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
