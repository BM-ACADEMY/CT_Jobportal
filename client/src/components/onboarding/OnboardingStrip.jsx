import React from 'react';
import { OnboardingProvider } from '../../context/OnboardingContext';
import IncompleteProfileBanner from './IncompleteProfileBanner';
import WelcomeTour from './WelcomeTour';

// For pages outside the dashboard layout (the logged-in home pages): the same next-step banner and first-login tour.
const OnboardingStrip = () => (
  <OnboardingProvider>
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-4 empty:hidden">
      <IncompleteProfileBanner />
    </div>
    <WelcomeTour />
  </OnboardingProvider>
);

export default OnboardingStrip;
