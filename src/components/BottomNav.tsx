import React from 'react';
import { LayoutDashboard, PenLine, Scale } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'recording' | 'dashboard' | 'body';
  setActiveTab: (tab: 'recording' | 'dashboard' | 'body') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-card rounded-t-[32px] px-8 py-4 pb-8 z-50 flex justify-around items-center">
      <button 
        onClick={() => setActiveTab('recording')}
        className={`nav-item flex-1 flex flex-col items-center gap-1 ${activeTab === 'recording' ? 'active text-primary-600' : 'text-slate-400'}`}
      >
        <PenLine size={24} />
        <span className="text-xs">기록</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`nav-item flex-1 flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'active text-primary-600' : 'text-slate-400'}`}
      >
        <LayoutDashboard size={24} />
        <span className="text-xs">분석</span>
      </button>

      <button 
        onClick={() => setActiveTab('body')}
        className={`nav-item flex-1 flex flex-col items-center gap-1 ${activeTab === 'body' ? 'active text-primary-600' : 'text-slate-400'}`}
      >
        <Scale size={24} />
        <span className="text-xs">체성분</span>
      </button>
    </nav>
  );
};

export default BottomNav;
