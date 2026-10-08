const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');

const setTokenCookie = (res, user) => {
  const token = generateToken(user._id, user.role);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed
  });

  setTokenCookie(res, user);
  res.json({
    _id: user._id,
    role: user.role
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && await bcrypt.compare(password, user.password)) {
    setTokenCookie(res, user);
    res.json({
      _id: user._id,
      role: user.role
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
};

exports.logout = async (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};