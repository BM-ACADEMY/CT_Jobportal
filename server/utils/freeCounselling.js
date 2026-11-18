// Every job seeker gets their first career counselling session free (switch it off or change it with
// COUNSELLING_FREE_SESSIONS, for example 0 or 2). A cancelled request does not use it up.
// Plans and the pay-per item are untouched: the free session is only used when nothing else covers the request.
const allowedFree = (env = process.env) => {
  const n = parseInt(env.COUNSELLING_FREE_SESSIONS, 10);
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 1;
};
const freeLeft = (countedRequests, env = process.env) => Math.max(0, allowedFree(env) - Math.max(0, countedRequests || 0));
module.exports = { allowedFree, freeLeft };
