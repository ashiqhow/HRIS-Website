const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'hris_super_secret_jwt_key_2026_dev_secure'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists',
        });
      }

      if (user.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: `Your account is ${user.status.toLowerCase()}. Please contact HR.`,
        });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('JWT Auth Error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed verification',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

// Authorize by Role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

// Granular Permission check
const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    if (
      req.user.role === 'HR Admin' ||
      (req.user.permissions && req.user.permissions[permissionKey])
    ) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires '${permissionKey}' permission.`,
    });
  };
};

module.exports = { protect, authorize, checkPermission };
