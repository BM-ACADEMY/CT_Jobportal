# Decisions made on your behalf (senior HR and pricing view) and what is still needed

I filled every open input from what you have told me and from what is in the code. Everything below is a recommendation you can overrule. Items marked **Needs you** cannot be decided by me.

## 1. Filled from your company records

| Item | Value used | Where |
|---|---|---|
| Footer and legal entity | Afra Ventures Private Limited, 78 Lenin St, Kosapalayam, Puducherry 605013 (CIN U62011PY2026PTC009819) | Privacy, Refund and Terms pages, lifecycle mail footer, receipts |
| GSTIN on receipts | 34ABGCA7083D1ZS | receipt mail |
| Support email | support@velaivaaipu.in | all legal pages |

## 2. Sender names (adopted from the plan)

| Audience | Sender | Reason |
|---|---|---|
| Job seekers | "Team Velai Vaaippu" <hello@velaivaaipu.in> | automated mail; a person's name would promise a reply we do not give |
| Companies | "Ilayapallavan from Velai Vaaippu" | a named person converts better, and he follows up by WhatsApp |
| Colleges | "Lokeshwari from Velai Vaaippu" | same, and she runs college sales |

Only use a person's name when that person really answers replies the same day. Otherwise use "Team Velai Vaaippu" for all three (one setting each, see `.env.example`).

## 3. Festival offer windows (Rs 2,999 scholarship)

Deepavali 2026 is Sunday 8 November ([officeholidays.com](https://www.officeholidays.com/holidays/india/tamil-nadu/diwali)). Students are at home, parents decide, and bonus money arrives. Run the offer for the buying week before and the decision days after.

| Festival | Offer window | Note |
|---|---|---|
| Deepavali 2026 | 30 Oct to 12 Nov 2026 | filled in `.env.example`; needs the Meta template approved first |
| Pongal 2027 | 8 to 18 Jan 2027 | Pongal falls on 14 January; confirm the date nearer the time |
| Tamil New Year 2027 | 7 to 17 Apr 2027 | falls on 14 April; confirm nearer the time |

Outside these windows the message offers the free 15-minute counselling call.

## 4. Job post templates

Ten roles that Pondicherry and Tamil Nadu employers hire for most: sales executive, telecaller / customer support, accountant, retail / showroom sales, receptionist / front office, digital marketing, graphic designer, software developer, office administrator / back office, production / machine operator. Edit in `client/src/data/jobTemplates.js`.

## 5. Pricing recommendation (to test, not market-verified)

Your rule: a price no portal can say no to, with trials. So keep the free tier real, and make the first paid step small enough that an owner approves it without asking anyone.

**Students and job seekers:** free. Upgrades stay pay-per (Real-time Job Alerts is Rs 49 for 30 days today).

**Companies** (per month, GST extra; yearly = 10 months):

| Plan | Price | Includes |
|---|---|---|
| Free | Rs 0 | 2 active jobs, 10 candidate searches a day, first 3 hires free |
| Starter | Rs 999 | 10 active jobs, 100 searches a day, applicant tracking, interview scheduling, 1 recruiter seat |
| Growth | Rs 2,499 | Unlimited jobs, AI matching, bulk messaging, 5 seats, priority listing |
| Urgent or bulk hiring | Hand over to CoreTalents | success fee, as in the mail plan |

**Colleges** (per year, GST extra, by student count):

| Plan | Price | Students | Includes |
|---|---|---|---|
| Campus Free | Rs 0 | up to 100 | already in the code |
| Campus Standard | Rs 9,999 | up to 500 | co-branded certificates, MoU, WhatsApp invites, reports |
| Campus Plus | Rs 19,999 | up to 1,500 | everything in Standard, scheduled placement reports |
| Campus Max | Rs 34,999 | up to 3,000 | everything, priority support |
| Above 3,000 | about Rs 10 a student | custom | |

That works out to about Rs 20, Rs 13 and Rs 12 a student a year. Offer MoU colleges a 60-day trial of Campus Standard. The soft skills program stays separate; I would start at Rs 1,999 a student and Rs 1,499 for batches of 30 or more, but you said the price is open, so treat that as a placeholder.

The plans are created in the admin screen, not in code, so nothing changes until you decide.

## 6. Still needed

1. **Needs you: the support phone or WhatsApp number for the footer.** I did not use your personal number. The footer leaves it out until `FOOTER_PHONE` is set.
2. **Needs you: yes or changes on the pricing sheet above**, then your developer creates the plans.
3. **Needs you: confirm the sender names**, and your developer makes `hello@velaivaaipu.in` able to send (SMTP login for that mailbox, plus SPF, DKIM and DMARC).
4. **Needs your CA: the receipt is not a GST tax invoice.** It shows seller, GSTIN, base amount and GST, but a tax invoice also needs an invoice number and SAC code, which I will not guess. Ask the CA what Razorpay's invoice already covers.
5. **Needs your developer:** the free plan limits (2 jobs, 10 searches, 3 free hires) are not in the code I read; confirm where plan limits live.
