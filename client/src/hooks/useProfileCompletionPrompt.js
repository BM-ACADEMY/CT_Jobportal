import { useState, useEffect } from 'react';

const TEN_MINUTES = 10 * 60 * 1000;

// Shows a jobseeker's profile-completion nudge on every Home mount/refresh,
// and again every 10 minutes while they stay on the page — no localStorage
// throttling, matching the "every refresh + every 10 min" requirement literally.
export const useProfileCompletionPrompt = (user) => {
  const completion = user?.profile?.profileCompletion ?? 100;
  const isIncomplete = user?.role === 'jobseeker' && completion < 100;
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Deferred via setTimeout so the state update happens as a follow-up
    // tick rather than synchronously inside the effect body.
    if (!isIncomplete) {
      const id = setTimeout(() => setShow(false), 0);
      return () => clearTimeout(id);
    }
    const showId = setTimeout(() => setShow(true), 0);
    const intervalId = setInterval(() => setShow(true), TEN_MINUTES);
    return () => {
      clearTimeout(showId);
      clearInterval(intervalId);
    };
  }, [isIncomplete]);

  return { show, completion, dismiss: () => setShow(false) };
};
