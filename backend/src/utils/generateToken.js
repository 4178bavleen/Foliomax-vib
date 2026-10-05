// src/utils/generateToken.js
const jwt = require("jsonwebtoken");

exports.generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { access: accessToken, refresh: refreshToken };
};
