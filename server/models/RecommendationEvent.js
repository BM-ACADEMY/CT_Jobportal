const mongoose = require('mongoose');

// One row per recommendation event, so suggestion quality can be measured: click rate, apply rate, shortlist rate.
// It stores ids, the surface and the score only. No names, contact details or profile text. Rows delete themselves after 180 days.
const recommendationEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  side: { type: String, enum: ['seeker', 'recruiter'], required: true }, // who the suggestion was shown to
  event: { type: String, enum: ['shown', 'clicked', 'applied', 'shortlisted'], required: true },
  surface: { type: String, enum: ['jobs_matched', 'home_feed', 'email', 'top_candidates', 'candidate_search'], required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // recruiter side: the suggested job seeker
  score: { type: Number, default: null },
  day: { type: String, required: true }, // YYYY-MM-DD, used to count a repeat view once per day
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 180 },
}, { versionKey: false });

recommendationEventSchema.index({ user: 1, job: 1, candidate: 1, surface: 1, event: 1, day: 1 }, { unique: true });
recommendationEventSchema.index({ event: 1, side: 1, surface: 1, createdAt: -1 });
recommendationEventSchema.index({ job: 1, event: 1, createdAt: -1 });

module.exports = mongoose.model('RecommendationEvent', recommendationEventSchema);
