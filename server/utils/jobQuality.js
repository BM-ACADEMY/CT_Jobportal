// Job post quality score (0-100) with plain tips, so a poster can fix a weak post BEFORE publishing.
// Pure function: no database, no AI. Looks only at the job's own fields, never at the poster.
const POINTS = { title: 20, skills: 30, location: 15, salary: 15, description: 15, experience: 5 };
const SKILLS_FOR_FULL_MARKS = 5;
const MIN_DESCRIPTION_CHARS = 80;
const VAGUE_TITLES = new Set(['job', 'jobs', 'hiring', 'urgent', 'vacancy', 'opening', 'staff', 'urgent hiring', 'we are hiring', 'work', 'employee']);

const text = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const isRemote = (job) => /remote|work from home|wfh/i.test(`${job.workMode || ''} ${job.location || ''}`);

const scoreJobPost = (job = {}) => {
  const tips = [];
  let score = 0;

  const title = text(job.title);
  const words = title.split(' ').filter(Boolean);
  if (!title) tips.push({ field: 'title', tip: 'Add a job title.' });
  else if (VAGUE_TITLES.has(title.toLowerCase()) || words.length < 2 || title.length < 8) {
    score += Math.round(POINTS.title / 2);
    tips.push({ field: 'title', tip: 'Make the title specific, for example "Accounts Executive (Tally)" instead of "Hiring".' });
  } else score += POINTS.title;

  const skills = [...new Set((Array.isArray(job.skillsRequired) ? job.skillsRequired : []).map((s) => text(s).toLowerCase()).filter(Boolean))];
  if (skills.length === 0) {
    tips.push({ field: 'skillsRequired', tip: 'List the skills needed. Jobs with no skills listed are shown to fewer people, because we cannot match them to candidates.' });
  } else {
    score += Math.round(POINTS.skills * Math.min(skills.length, SKILLS_FOR_FULL_MARKS) / SKILLS_FOR_FULL_MARKS);
    if (skills.length < SKILLS_FOR_FULL_MARKS) {
      tips.push({ field: 'skillsRequired', tip: `Adding ${SKILLS_FOR_FULL_MARKS - skills.length} more skill${SKILLS_FOR_FULL_MARKS - skills.length === 1 ? '' : 's'} helps us find better matches.` });
    }
  }

  if (text(job.location) || isRemote(job)) score += POINTS.location;
  else tips.push({ field: 'location', tip: 'Add the job location, or mark the job as remote.' });

  const min = Number(job.salary?.min) || 0;
  const max = Number(job.salary?.max) || 0;
  if (max > 0 && min <= max && !job.salary?.isRangeHidden) score += POINTS.salary;
  else if (max > 0 && min <= max) {
    score += Math.round(POINTS.salary / 2);
    tips.push({ field: 'salary', tip: 'Showing the salary range gets more applications.' });
  } else tips.push({ field: 'salary', tip: 'Add a salary range. Posts with a range get more applications.' });

  if (text(job.description).length >= MIN_DESCRIPTION_CHARS) score += POINTS.description;
  else tips.push({ field: 'description', tip: `Describe the work in at least ${MIN_DESCRIPTION_CHARS} characters: what the person will do each day.` });

  if (job.experience && (Number(job.experience.max) > 0 || Number(job.experience.min) > 0)) score += POINTS.experience;
  else tips.push({ field: 'experience', tip: 'Set the experience needed. Leave it at 0 only if freshers can apply.', optional: true });

  const rounded = Math.max(0, Math.min(100, score));
  return { score: rounded, level: rounded >= 80 ? 'good' : rounded >= 50 ? 'ok' : 'weak', tips };
};

module.exports = { scoreJobPost, POINTS };
