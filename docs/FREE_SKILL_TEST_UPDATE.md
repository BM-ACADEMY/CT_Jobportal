# Free skill test: dropdown + question bank (update)

## What changed
- `/free-assessment` now shows a **dropdown of skills** (no typing, no spelling mistakes, no dead end). The page text still says "AI-powered": the questions are written by AI and checked by a person before students see them.
- Questions come from the **pre-made question bank**, not a live AI call. If OpenRouter is down, students still get a test.
- **Marks are calculated on the server.** The browser gets the right answers only after it submits. Results save the same way as before (`/skill-tests/save`, pending-assessment after sign-up).
- Skills: the original 7 plus **10 new** (MS Word and PowerPoint, Typing and Data Entry, Aptitude and Reasoning, Basic English Grammar, HTML and CSS, Python Basics, SQL Basics, Sales Basics, HR Basics, Banking and Finance Basics). The dropdown lists **only skills that have at least one set in the bank**, so nothing broken is ever shown.
- New endpoints: `GET /api/assessments/skills`, `GET /api/assessments/bank?category=`, `POST /api/assessments/bank/submit` (rate limited).
- Files: `server/config/courseMap.js`, `server/controllers/assessmentController.js`, `server/routes/assessmentRoutes.js`, `client/src/pages/public/FreeAssessment.jsx`, tests `server/tests/auth/freeBankTest.test.js`, `courseMap.test.js`.

## Steps for the developer
1. Apply the patch. Run `cd server && npm test`.
2. On the server: `node scripts/generateQuestionBank.js --sets 5` (needs OpenRouter credit; about 85 AI calls for 17 skills).
3. Dev 2 reviews the questions (checklist below). Mark bad sets `active: false` in `campusquestionsets`.
4. Open `/free-assessment` on a phone: the dropdown must list every reviewed skill; finish one test; check the score and review screen.
5. The old public endpoint `/api/assessments/public` (free text, answers in the response) is no longer used by the page. Remove or protect it (task T24).
6. The campus registration page still shows the original 7 skills. Add the new ones to `client/src/data/skillCategories.js` if you want them there too.

## Dev 2 question review checklist (about 5 questions per skill, all 17 skills)
- Exactly one option is clearly correct; check it yourself, do not trust the marked answer.
- No two options mean the same thing; no "all of the above" tricks.
- Wording is simple English, fresher level, Indian context (rupees, Indian companies, Tally, GST) where it helps.
- No question about prices of a brand or a company's current policy.
- No wrong or out-of-date facts (GST rules, software menus, Python/SQL syntax).
- Question and options read well on a phone (short).
- Two sets for the same skill are not copies of each other.
- If a set has 2 or more problems, set `active: false` and regenerate; do not edit by hand.
- Log: skill, set id, question number, problem, action.

## For Kamar to confirm
The course shown after a low score for each new skill (WhatsApp follow-up and mail), currently: MS Word and PowerPoint, Typing and Data Entry, Python Basics, SQL Basics, Banking and Finance go to Data Analytics with Power BI; Aptitude, English Grammar and HR Basics go to Soft Skills and Interview Prep; HTML and CSS goes to Web Design (Basic); Sales Basics goes to AI-powered Digital Marketing.
