// Which jobs count against a person's posting limit. A solo recruiter: their own jobs. Someone with a
// company: the company's jobs. Someone with no company yet (a company owner who has not filled in the
// profile): their own jobs. Before this helper the last case had no filter at all and counted every job
// on the platform, so a new company owner was told the limit was reached before posting anything.
const activeJobCountQuery = (user, userId) => {
  const query = { status: { $in: ['active', 'closed'] } };
  const roleName = user?.role?.name || user?.role;
  if (roleName === 'recruiter' || !user?.company) {
    query.recruiter = userId;
  } else {
    query.company = user.company;
  }
  return query;
};

module.exports = { activeJobCountQuery };
