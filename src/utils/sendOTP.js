// // src/utils/sendOTP.js
// import sgMail from "@sendgrid/mail";

// const { SENDGRID_API_KEY, SENDER_EMAIL } = process.env;

// // Inform about initialization
// if (!SENDGRID_API_KEY) {
//   console.warn("[sendOTP] ⚠️ SENDGRID_API_KEY not set — emails will NOT be sent (dev mode)");
// } else {
//   sgMail.setApiKey(SENDGRID_API_KEY);
//   console.log("[sendOTP] ✅ SendGrid initialized with API key");
// }

// /**
//  * Send Email OTP using SendGrid
//  */
// export async function sendEmailOTP(email, otp) {
//   if (!SENDGRID_API_KEY) {
//     console.log(`[sendEmailOTP DEV] Email=${email} OTP=${otp}`);
//     return true;
//   }

//   const msg = {
//     to: email,
//     from: SENDER_EMAIL || "no-reply@yourdomain.com", // MUST match verified sender
//     subject: "Your Verification OTP",
//     text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px;">
//         <h2>Your Verification Code</h2>
//         <p>Your OTP is:</p>
//         <h1 style="letter-spacing: 4px;">${otp}</h1>
//         <p>This code expires in <strong>10 minutes</strong>.</p>
//       </div>
//     `,
//   };

//   try {
//     const response = await sgMail.send(msg);
//     console.log("[sendEmailOTP] 📧 Email sent, status:", response[0].statusCode);
//     return true;
//   } catch (err) {
//     console.error("//////////////////////////////");
//     console.error("[sendEmailOTP ERROR] Full Error:", err);

//     if (err.response?.body) {
//       console.error("[sendEmailOTP ERROR] SendGrid error body:", JSON.stringify(err.response.body));
//     }

//     console.error("////////////////////////////");
//     throw err; // propagate error to controller
//   }
// }

// /**
//  * Mobile OTP (DEV ONLY)
//  */
// export async function sendSmsOTP(mobile, otp) {
//   console.log(`[sendSmsOTP DEV] SMS to=${mobile} otp=${otp}`);
//   return true;
// }


// src/utils/sendOTP.js
import sgMail from "@sendgrid/mail";

const { SENDGRID_API_KEY, SENDER_EMAIL } = process.env;

if (!SENDGRID_API_KEY) {
  console.warn("[sendOTP] ⚠️ SENDGRID_API_KEY not set — emails will NOT be sent (dev mode)");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("[sendOTP] ✅ SendGrid initialized with API key");
}

// simple email validation
function isEmail(e) {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/**
 * Send Email OTP using SendGrid
 * Throws an Error with useful message if send fails.
 * Returns { ok: true } on success.
 */
export async function sendEmailOTP(email, otp) {
  if (!isEmail(email)) {
    const msg = `[sendEmailOTP] invalid email: ${email}`;
    console.error(msg);
    throw new Error("Invalid email address");
  }

  if (!SENDGRID_API_KEY) {
    // Dev fallback: just log so local dev works without keys
    console.log(`[sendEmailOTP DEV] Email=${email} OTP=${otp}`);
    return { ok: true, dev: true };
  }

  if (!SENDER_EMAIL) {
    console.error("[sendEmailOTP] SENDER_EMAIL not set in env — must be a verified SendGrid sender");
    // Throw so caller can rollback registration (we do rollback on failure)
    throw new Error("Mail sender not configured (SENDER_EMAIL missing)");
  }

  const from = SENDER_EMAIL;
  const msg = {
    personalizations: [
      {
        to: [{ email }],
        subject: "Your verification code",
      },
    ],
    from: { email: from, name: "Your App Name" }, // change "Your App Name"
    replyTo: { email: from },
    content: [
      {
        type: "text/plain",
        value: `Your OTP is ${otp}. It will expire in 10 minutes.`,
      },
      {
        type: "text/html",
        value: `
          <div style="font-family: Arial, sans-serif; padding: 16px;">
            <h2>Your verification code</h2>
            <p>Your OTP is:</p>
            <h1 style="letter-spacing: 4px;">${otp}</h1>
            <p>This code expires in <strong>10 minutes</strong>.</p>
          </div>
        `,
      },
    ],
    mailSettings: {
      bypassListManagement: false,
      footer: { enable: false },
      sandboxMode: false,
    },
    trackingSettings: {
      clickTracking: { enable: false, enableText: false },
      openTracking: { enable: false },
    },
  };

  try {
    const response = await sgMail.send(msg);
    // SendGrid returns an array of responses
    const status = response && response[0] && response[0].statusCode;
    console.log(`[sendEmailOTP] 📧 Email sent to=${email} status=${status}`);
    return { ok: true, status };
  } catch (err) {
    console.error("[sendEmailOTP ERROR] SendGrid full error:", err);

    // Extract useful SendGrid error body if present
    let sgErrBody = null;
    if (err?.response?.body) {
      sgErrBody = err.response.body;
      console.error("[sendEmailOTP ERROR] SendGrid error body:", JSON.stringify(sgErrBody));
    }

    // Build a clear error to propagate
    const message =
      sgErrBody && Array.isArray(sgErrBody.errors) && sgErrBody.errors.length
        ? sgErrBody.errors.map((e) => e.message).join("; ")
        : err.message || "SendGrid error";

    const error = new Error(message);
    error.detail = sgErrBody || err;
    throw error;
  }
}

/**
 * Mobile OTP (DEV ONLY)
 */
export async function sendSmsOTP(mobile, otp) {
  console.log(`[sendSmsOTP DEV] SMS to=${mobile} otp=${otp}`);
  return { ok: true, dev: true };
}
