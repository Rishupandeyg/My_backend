// src/utils/otp.js
exports.generateOTP = (length = 6) => {
  // generate numeric OTP of specified length
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};
