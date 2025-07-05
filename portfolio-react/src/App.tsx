import React, { useState } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import Summary from './components/Summary';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Education from './components/Education';
import Projects from './components/Projects';
import Certifications from './components/Certifications';
import Footer from './components/Footer';
import './App.css';

export type TabType = 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return <Summary />;
      case 'skills':
        return <Skills />;
      case 'experience':
        return <Experience />;
      case 'education':
        return <Education />;
      case 'projects':
        return <Projects />;
      case 'certifications':
        return <Certifications />;
      default:
        return <Summary />;
    }
  };

  return (
    <div className="bg-pattern bg-dark-bg">
      <div className="container max-w-[1100px] mx-auto px-4 py-8">
        <div className="main-card">
          <Header />
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="content-container p-6 md:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;
