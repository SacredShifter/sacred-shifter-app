import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { MeditationProvider } from './contexts/MeditationContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import EchoGlyphsPage from './pages/EchoGlyphsPage';
import CommunityPage from './pages/CommunityPage';
import JournalPage from './pages/JournalPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './contexts/AuthContext';

const queryClient = new QueryClient();

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Layout><HomePage /></Layout> : <Navigate to="/login" />} />
      <Route path="/echo-glyphs" element={user ? <Layout><EchoGlyphsPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/community" element={user ? <Layout><CommunityPage /></Layout> : <Navigate to="/login" />} />
      <Route path="/journal" element={user ? <Layout><JournalPage /></Layout> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <MeditationProvider>
            <AppRoutes />
            <Toaster />
          </MeditationProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
