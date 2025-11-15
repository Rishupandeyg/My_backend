// src/utils/sendOTP.js
// Implement these using nodemailer / Twilio / your provider
// For now they log and return true — replace with real provider calls.

export async function sendEmailOTP(email, otp) {
  // TODO: replace with nodemailer or SES in production
  console.log(`[sendEmailOTP] to=${email} otp=${otp}`);
  // Example nodemailer usage (pseudo):
  // await transporter.sendMail({ to: email, subject: "Your OTP", text: `Your OTP: ${otp}` });
  return true;
}

export async function sendSmsOTP(mobile, otp) {
  // TODO: replace with SMS provider like Twilio, MSG91, etc.
  console.log(`[sendSmsOTP] to=${mobile} otp=${otp}`);
  // Example Twilio usage (pseudo):
  // await twilioClient.messages.create({ to: mobile, from: TWILIO_FROM, body: `Your OTP: ${otp}` });
  return true;
}
