module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    cookieExpires: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,
  },
  bcrypt: {
    saltRounds: 12,
  },
};
