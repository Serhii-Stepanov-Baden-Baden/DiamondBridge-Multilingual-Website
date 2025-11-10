// App.tsx — DiamondBridge Multilingual Website
import React from 'react';
import { LanguageProvider } from './i18n/Context';
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
import './index.css';

const App = () => {
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900">
    <Navigation />
    <main className="pt-16">
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
  </div>
```
);

};

export default App;
