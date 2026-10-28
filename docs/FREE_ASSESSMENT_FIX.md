# Free assessment: server-side scoring

## What was wrong
- `GET /api/assessments/public` returned every question with `correct_option` and `explanation`, so anyone could read the answers in the browser's Network tab.
- The browser calculated the score, and `POST /api/skill-tests/save` stored whatever score, `passed` flag and questions the browser sent. A logged-in job seeker could save a perfect result for any skill without taking the test.
- The endpoint was public with no rate limit and called the AI on every request (cost abuse), and the skill text went straight into the AI prompt.

## What it does now
- `GET /api/assessments/public?skill=&difficulty=` returns the questions without answers or explanations, plus a signed `attemptToken` (2 hours). Skill text is cleaned (letters, digits, a few separators, 60 characters). Difficulty must be easy, medium or hard. Rate limit: 40 starts per 15 minutes per network.
- `POST /api/assessments/public/submit` with `{ attemptToken, answers: { "<questionId>": "a" } }`. The server scores it, rejects submissions faster than 2 seconds a question, and accepts each attempt once (a second submit returns 409), so guesses cannot be retried to discover the answers. It returns `score`, `total`, `percentage`, `passed` (60%) and a signed `resultToken` (7 days). Rate limit: 120 per 15 minutes per network.
- `POST /api/skill-tests/save` now needs `{ resultToken, answers }` and takes skill, difficulty and score only from the signed token. A body with a made-up score or no token gets 400.
- Every attempt is stored as its own question set (options shuffled), including when the AI is down and a cached set is reused.
- Client: `FreeAssessment.jsx` posts the answers to the submit endpoint, shows the server's score, and keeps only `resultToken` (no questions) in `pendingAssessment` so the later login/register save works through `AuthContext` unchanged.

## Deploy notes
- Deploy server and client together. A phone that already has an old `pendingAssessment` in storage (no `resultToken`) will see "Please open Skill Tests from your dashboard" instead of an automatic save. That is harmless.
- Tests: `server/tests/auth/freeAssessment.test.js` (9 cases) covers hidden answers, server scoring ignoring a forged score, single submission, too-quick and forged tokens, the AI-down cache path, and the save endpoint rejecting a client-supplied score.

## Still open (found while reading, not changed)
- `POST /api/skill-tests/:category/claim-certificate` is public, trusts the score from the request body and creates a user from only a name and phone number. The client does not call it. Recommend removing the route.
- `GET /:category/start` and `POST /:category/submit` (old category tests) are also unused by the client; `submit` uses a 70% pass mark and only returns the score, but it is a second scoring path to retire.
- A result token is not tied to the person who took the test, so a copied token could be saved by another job seeker. It still proves a real score on a real attempt.
