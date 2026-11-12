import React, { useEffect, useRef } from 'react';
import { trackSponsor } from '@/utils/sponsorTrack';

// The "Sponsored" label on a job card. Showing it counts one view, and tapping the card it sits in counts one click
// (both once per session, see utils/sponsorTrack.js).
const SponsoredBadge = ({ jobId }) => {
  const ref = useRef(null);
  useEffect(() => {
    trackSponsor(jobId, 'view');
    const card = ref.current?.closest('a');
    if (!card) return undefined;
    const onClick = () => trackSponsor(jobId, 'click');
    card.addEventListener('click', onClick);
    return () => card.removeEventListener('click', onClick);
  }, [jobId]);
  return <span ref={ref} className="inline-flex items-center text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0 uppercase">Sponsored</span>;
};

export default SponsoredBadge;
