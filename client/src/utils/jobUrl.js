// Job URLs look like /job/senior-react-developer-chennai-<24-char id>.
// The id is always the last 24 hex characters, so old /job/<id> links keep working.
const slugify = (text) => String(text ?? '')
  .toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);

export const jobIdFromParam = (param) => (String(param || '').match(/([a-f0-9]{24})$/i) || [])[1] || String(param || '');

export const jobPath = (job) => {
  const id = job?._id || job?.id;
  const parts = [slugify(job?.title), slugify(job?.location)].filter(Boolean).join('-');
  return `/job/${parts ? `${parts}-` : ''}${id}`;
};
