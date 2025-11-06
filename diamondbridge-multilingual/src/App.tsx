import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from './i18n/Context';
import { QueryProvider } from './providers/QueryProvider';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { MechanicsSection } from './components/MechanicsSection';
import { GeniusHubsSection } from './components/GeniusHubsSection';
import { AIChatSection } from './components/AIChatSection';
import { MediaToolsSection } from './components/MediaToolsSection';
import { DriveSection } from './components/DriveSection';
import { DashboardSection } from './components/DashboardSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import './App.css';

function App() {
  // 🛠️ Фикс автоскролла при загрузке
  useEffect(() => {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <QueryProvider>
      <I18nProvider>
        <div className="min-h-screen bg-white">
          <Navigation />
          <main>
            <HeroSection />
            <ProblemSection />
            <SolutionSection />
            <MechanicsSection />
            <GeniusHubsSection />
            <AIChatSection />
            <MediaToolsSection />
            <DriveSection />
            <DashboardSection />
            <AboutSection />
            <ContactSection />
          </main>
          <Footer />

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </I18nProvider>
    </QueryProvider>
  );
}

export default App;
