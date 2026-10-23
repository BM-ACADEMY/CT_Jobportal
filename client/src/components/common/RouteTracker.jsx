import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView, captureUtm } from '../../utils/analytics';

// Sends a page view on every client-side navigation. Private dashboards are not reported.
const PRIVATE_PREFIXES = ['/admin', '/company', '/college', '/candidate', '/employee', '/incharge', '/subadmin'];

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => { initAnalytics(); }, []);

  useEffect(() => {
    captureUtm();
    if (PRIVATE_PREFIXES.some((p) => location.pathname.startsWith(p))) return;
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
};

export default RouteTracker;
