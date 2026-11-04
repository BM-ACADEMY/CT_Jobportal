// Prints a fresh VAPID key pair for web push. Run once, put the two values in the server .env, and never
// change them afterwards (every browser subscription is tied to the public key).
//   node scripts/generateVapidKeys.js
const webPush = require('web-push');

const keys = webPush.generateVAPIDKeys();
console.log('Add these to server/.env (keep the private key secret):\n');
console.log(`WEB_PUSH_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`WEB_PUSH_VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('WEB_PUSH_SUBJECT=mailto:hello@velaivaaipu.in');
