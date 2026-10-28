import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const OnboardingContext = createContext({ data: null, reload: () => {}, tourOpen: false, openTour: () => {}, closeTour: () => {} });
const API = import.meta.env.VITE_API_BASE_URL;
const MIN_GAP_MS = 30 * 1000;

export const OnboardingProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);
  const lastFetch = useRef(0);
  const autoOpened = useRef(false);

  const reload = useCallback(async (force = false) => {
    if (!user) return;
    if (!force && Date.now() - lastFetch.current < MIN_GAP_MS) return;
    lastFetch.current = Date.now();
    try {
      const res = await axios.get(`${API}/onboarding`);
      setData(res.data);
    } catch {
      /* the checklist is a convenience; never block the page */
    }
  }, [user]);

  // Load on sign-in, and again when the tab regains focus (the person may have just saved their profile).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload(true);
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);

  // First login: open the tour once.
  useEffect(() => {
    if (data?.enabled && !data.tourSeen && !autoOpened.current) {
      autoOpened.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTourOpen(true);
    }
  }, [data]);

  const closeTour = useCallback(async () => {
    setTourOpen(false);
    if (data && !data.tourSeen) {
      setData((d) => (d ? { ...d, tourSeen: true } : d));
      try { await axios.post(`${API}/onboarding/tour-seen`); } catch { /* ignore */ }
    }
  }, [data]);

  return (
    <OnboardingContext.Provider value={{ data, reload, tourOpen, openTour: () => setTourOpen(true), closeTour }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
