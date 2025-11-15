// src/utils/sendOTP.js
import nodemailer from "nodemailer";

// Load environment variables
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM
} = process.env;

// Create transporter only if SMTP variables exist
let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: Number(SMTP_PORT) === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  console.log("[sendOTP] SMTP transporter initialized");
} else {
  console.warn("[sendOTP] ⚠️ SMTP not configured — OTP will NOT be sent to email");
}

// ===============================
// EMAIL OTP FUNCTION
// ===============================
export async function sendEmailOTP(email, otp) {
  if (!transporter) {
    console.log(`[sendEmailOTP] (DEV MODE) to=${email} otp=${otp}`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: email,
      subject: "Your OTP Verification Code",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <b>${otp}</b></p>`,
    });

    console.log("[sendEmailOTP] Sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("[sendEmailOTP ERROR]", err);
    return false;
  }
}

// ===============================
// MOBILE OTP (still dev mode)
// ===============================
export async function sendSmsOTP(mobile, otp) {
  // No SMS API connected — just log
  console.log(`[sendSmsOTP] (DEV MODE) to=${mobile} otp=${otp}`);
  return true;
}
