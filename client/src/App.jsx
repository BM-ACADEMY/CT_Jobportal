import { lazy, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/common/ScrollToTop';
import RouteTracker from './components/common/RouteTracker';
import { Toaster } from 'sonner';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster position="top-center" richColors />
        <Router>
          <ScrollToTop />
          <RouteTracker />
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
