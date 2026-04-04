import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './index.css';

const themeConfig = {
  token: {
    colorPrimary: '#457eff',
    borderRadius: 8,
    fontFamily: "'Inter', system-ui, sans-serif",
    colorBgContainer: '#ffffff',
    colorBorder: '#e5e7eb',
  },
  components: {
    Button: { borderRadius: 8, controlHeight: 40, fontWeight: 600 },
    Card: { borderRadiusLG: 16 },
    Input: { borderRadius: 8, controlHeight: 44 },
    Form: { labelFontSize: 13 },
  },
};

function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
