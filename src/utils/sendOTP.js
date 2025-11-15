// src/utils/sendOTP.js
// Implement these functions with nodemailer / SES / Twilio / any SMS provider.

exports.sendEmailOTP = async (email, otp) => {
  // Example using nodemailer (pseudo):
  // await transporter.sendMail({ to: email, subject: 'Your OTP', text: `Your OTP is ${otp}` })
  console.log(`sendEmailOTP -> ${email}: ${otp}`);
  return true;
};

exports.sendSmsOTP = async (mobile, otp) => {
  // Example using SMS provider:
  console.log(`sendSmsOTP -> ${mobile}: ${otp}`);
  return true;
};
