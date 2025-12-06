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
