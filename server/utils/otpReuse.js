// Verification codes while the mail server is slow.
// If a person taps "Resend" or logs in again while their first code is still valid, we send the SAME code again instead of making
// a new one. Otherwise a late first mail arrives after the second code replaced it, and the person types a dead code.
// The wrong-guess counter is never reset while the same code stays in use, so this gives nobody extra guesses.
const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const planOtp = (user, generate, now = new Date()) => {
  const stillValid = !!user.otp && user.otpExpiry && new Date(user.otpExpiry) > now && (user.otpAttempts || 0) < MAX_ATTEMPTS;
  if (stillValid) return { otp: user.otp, otpAttempts: user.otpAttempts || 0, otpExpiry: new Date(now.getTime() + TTL_MS), reused: true };
  return { otp: generate(), otpAttempts: 0, otpExpiry: new Date(now.getTime() + TTL_MS), reused: false };
};

module.exports = { planOtp, TTL_MS, MAX_ATTEMPTS };
