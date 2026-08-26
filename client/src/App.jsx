import { lazy, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'sonner';
import './index.css';

const CursorLens = lazy(() => import('./components/common/CursorLens'));

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster position="top-center" richColors />
        <Suspense fallback={null}><CursorLens /></Suspense>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
