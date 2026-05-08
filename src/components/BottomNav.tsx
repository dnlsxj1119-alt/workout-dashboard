import React from 'react';
import { LayoutDashboard, PenLine } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'recording' | 'dashboard';
  setActiveTab: (tab: 'recording' | 'dashboard') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-[32px] px-8 py-4 pb-8 z-50 flex justify-around items-center">
      <button 
        onClick={() => setActiveTab('recording')}
        className={`nav-item ${activeTab === 'recording' ? 'active' : ''}`}
      >
        <PenLine size={24} />
        <span className="text-xs">기록</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
      >
        <LayoutDashboard size={24} />
        <span className="text-xs">분석</span>
      </button>
    </nav>
  );
};

export default BottomNav;
