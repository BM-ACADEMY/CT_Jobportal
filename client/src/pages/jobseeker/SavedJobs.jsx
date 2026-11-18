import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Bookmark, Search } from 'lucide-react';
import PageSOPBanner from '../../components/common/PageSOPBanner';
import { Page, PageHeader, JobItem, JobItemSkeleton, EmptyState, useSavedJobs, btnPrimary } from '@/components/candidate/CandidateUI';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const saved = useSavedJobs();

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/user/saved-jobs`)
      .then((res) => setSavedJobs(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error('Error fetching saved jobs:', err);
        toast.error('Could not load saved jobs');
      })
      .finally(() => setLoading(false));
  }, []);

  // Removing a job here takes it off the list straight away.
  const handleToggle = async (job) => {
    const next = await saved.toggle(job);
    if (next && !next.some((id) => String(id?._id || id) === String(job._id))) {
      setSavedJobs((list) => list.filter((j) => j._id !== job._id));
    }
  };

  return (
    <Page className="max-w-5xl">
      <PageSOPBanner pageKey="savedJobs" />

      <PageHeader
        eyebrow="Saved jobs"
        title="Jobs you saved"
        text={loading ? 'Jobs you bookmark show up here so you can apply later.' : `${savedJobs.length} ${savedJobs.length === 1 ? 'job' : 'jobs'} saved. Tap the bookmark to remove one.`}
        action={<Link to="/jobs" className={btnPrimary}><Search size={16} /> Find jobs</Link>}
      />

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{[1, 2, 3, 4].map((i) => <JobItemSkeleton key={i} />)}</div>
      ) : savedJobs.length === 0 ? (
        <EmptyState
          Icon={Bookmark}
          title="No saved jobs yet"
          text="Tap the bookmark on any job to keep it here for later."
          action={<Link to="/jobs" className={btnPrimary}>Browse jobs</Link>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {savedJobs.map((job) => (
            <JobItem key={job._id} job={job} saved onToggleSave={handleToggle} />
          ))}
        </div>
      )}
    </Page>
  );
};

export default SavedJobs;
