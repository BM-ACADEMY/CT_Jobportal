import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicHeader from '../components/common/PublicHeader';

// Public layout used for the landing page — has a header but no sidebar
const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
