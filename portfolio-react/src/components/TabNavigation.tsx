import React from 'react';
import { TabType } from '../App';

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'summary', label: 'Summary', icon: 'fas fa-user-circle' },
    { id: 'skills', label: 'Skills', icon: 'fas fa-laptop-code' },
    { id: 'experience', label: 'Experience', icon: 'fas fa-briefcase' },
    { id: 'education', label: 'Education', icon: 'fas fa-graduation-cap' },
    { id: 'projects', label: 'Projects', icon: 'fas fa-code-branch' },
    { id: 'certifications', label: 'Certifications', icon: 'fas fa-certificate' },
  ];

  return (
    <div className="tabs-container bg-[#141824] p-3 flex justify-center relative">
      <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-r from-transparent via-[#1e3a70] to-transparent opacity-5"></div>
      <div className="tabs-wrapper flex space-x-1 relative z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`tab-btn px-4 py-2 rounded-md flex items-center transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-primary to-[#3490d9] text-white shadow-md'
                : 'bg-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <i className={`${tab.icon} mr-2`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;