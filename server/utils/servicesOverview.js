// Super Admin "all services" numbers. Pure shaping so it can be tested without a database.
const n = (v) => (Number.isFinite(v) ? v : 0);

const shapeOverview = (r = {}) => ({
  internships: {
    live: n(r.internshipsLive), free: n(r.internshipsFree), applications: n(r.internshipApps),
    students: n(r.internshipStudents), selected: n(r.internshipSelected),
    topCompanies: Array.isArray(r.internshipTop) ? r.internshipTop.slice(0, 10) : [],
  },
  drives: { total: n(r.drivesTotal), pending: n(r.drivesPending), published: n(r.drivesPublished), paid: n(r.drivesPaid), registrations: n(r.driveRegistrations) },
  promotions: { sponsoredJobs: n(r.sponsoredJobs), urgentJobs: n(r.urgentJobs) },
  logos: { companiesAgreed: n(r.logoAgreed), companiesApproved: n(r.logoApproved), collegesApproved: n(r.collegeLogoApproved) },
  whatsapp: { optIns: n(r.waOptIns), referredSignups: n(r.referred) },
});
module.exports = { shapeOverview };
