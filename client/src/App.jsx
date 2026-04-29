import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'sonner';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" richColors />
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
