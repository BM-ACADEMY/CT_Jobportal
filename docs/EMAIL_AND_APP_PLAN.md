# Permanent email fix and the mobile app (steps)

These two need accounts and DNS access, so they are steps for Sneha and Kamar, not code.

## 1. Permanent email fix (transactional mail with the domain verified)

Goal: sign-up codes and invites reach the inbox, not spam, and never wait in a queue.

1. In Brevo (or the service chosen), open Senders, domains and IPs, then Domains, and add `velaivaaipu.in`.
2. Brevo shows DNS records. Add them at the domain's DNS host:
   - **SPF**: one TXT record on the domain that includes Brevo. If an SPF record already exists (for Hostinger mail), merge into it, because a domain may have only one SPF record.
   - **DKIM**: the TXT record Brevo gives (a long key), or its CNAME form.
   - **DMARC**: TXT on `_dmarc.velaivaaipu.in`. Start with `v=DMARC1; p=none; rua=mailto:hello@velaivaaipu.in`. Move to `p=quarantine` after two clean weeks.
3. In Brevo press Authenticate and wait for green ticks on all of them.
4. Send from an address on the domain (for example `no-reply@velaivaaipu.in`). Set it as the sender in the server settings (the existing mail settings).
5. Credits: the free plan is 300 mails a day, and mails that go over the limit are held silently. Watch the daily usage in the Admin Daily activity page. If we pass about 200 a day, move to the paid Starter plan before it blocks codes.
6. Keep the Hostinger backup sender (`mail-fallback`) switched on. It covers a connection failure, not a held queue.
7. Test: send a code to a Gmail address and a Yahoo address, open "Show original", and check SPF, DKIM and DMARC all say PASS.

## 2. Mobile app (Version 3)

1. Installable website first (branch `installable-site`): web manifest, icons, a service worker for the shell. Test Add to Home Screen on Android and iPhone.
2. Play Store wrapper of the same site, as a Trusted Web Activity:
   - A Google Play developer account (one-time fee, in the company's name).
   - Build with Bubblewrap (`@bubblewrap/cli`) from the site manifest.
   - Add `/.well-known/assetlinks.json` to the site so the app opens without the browser bar.
   - Needs a privacy policy URL (exists) and store listing text and screenshots.
3. iPhone: the installable website is enough for now. An App Store app needs a paid Apple developer account and extra review, so leave it for later.
