import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { MeditationProvider } from './contexts/MeditationContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import CirclesPage from './pages/CirclesPage';
import JournalPage from './pages/JournalPage';
import ResonanceRegisterPage from './pages/ResonanceRegisterPage';
import EchoGlyphsPage from './pages/EchoGlyphsPage';
import MeditationPage from './pages/MeditationPage';
import CommunityPage from './pages/CommunityPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MeditationProvider>
          <Routes>
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/feed" element={<Layout><FeedPage /></Layout>} />
            <Route path="/circles" element={<Layout><CirclesPage /></Layout>} />
            <Route path="/journal" element={<Layout><JournalPage /></Layout>} />
            <Route path="/resonance-register" element={<Layout><ResonanceRegisterPage /></Layout>} />
            <Route path="/echo-glyphs" element={<Layout><EchoGlyphsPage /></Layout>} />
            <Route path="/meditation" element={<Layout><MeditationPage /></Layout>} />
            <Route path="/community" element={<Layout><CommunityPage /></Layout>} />
          </Routes>
          <Toaster />
        </MeditationProvider>
      </Router>
    </QueryClientProvider>
  );
}
