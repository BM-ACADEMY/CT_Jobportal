import { lazy, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/common/ScrollToTop';
import IntroLoader from './components/common/IntroLoader';
import RouteTracker from './components/common/RouteTracker';
import { Toaster } from 'sonner';
import './index.css';

function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <SocketProvider>
        <Toaster position="top-center" richColors />
        <IntroLoader />
        <Router>
          <ScrollToTop />
          <RouteTracker />
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
