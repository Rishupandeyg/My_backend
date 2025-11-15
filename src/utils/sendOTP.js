// src/utils/sendOTP.js
import sgMail from "@sendgrid/mail";

const { SENDGRID_API_KEY, SENDER_EMAIL } = process.env;

if (!SENDGRID_API_KEY) {
  console.warn("[sendOTP] ⚠️ SENDGRID_API_KEY not set — emails will be logged only (dev mode).");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("[sendOTP] SendGrid initialized");
}

/**
 * sendEmailOTP(email, otp)
 * - Uses SendGrid API if SENDGRID_API_KEY present
 * - Falls back to console.log in dev mode
 */
export async function sendEmailOTP(email, otp) {
  if (!SENDGRID_API_KEY) {
    console.log(`[sendEmailOTP DEV] to=${email} otp=${otp}`);
    return true;
  }

  const msg = {
    to: email,
    from: SENDER_EMAIL || "no-reply@yourdomain.com", // must be a verified sender in SendGrid
    subject: "Your verification code",
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  };

  try {
    const res = await sgMail.send(msg);
    // res is an array of responses for each recipient; statusCode usually 202
    console.log("[sendEmailOTP] SendGrid response:", res && res[0] && res[0].statusCode);
    return true;
  } catch (err) {
    // SendGrid returns useful error info in err.response.body
    if (err && err.response && err.response.body) {
      console.error("[sendEmailOTP] SendGrid error body:", JSON.stringify(err.response.body));
    } else {
      console.error("[sendEmailOTP] SendGrid error:", err);
    }
    throw err;
  }
}

/**
 * sendSmsOTP still left as dev fallback (we're email-only)
 */
export async function sendSmsOTP(mobile, otp) {
  console.log(`[sendSmsOTP DEV] to=${mobile} otp=${otp}`);
  return true;
}
