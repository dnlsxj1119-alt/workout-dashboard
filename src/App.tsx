import React, { useState, useMemo } from 'react';
import { Workout } from './types/workout';
import { useLocalStorage } from './hooks/useLocalStorage';
import RecordingScreen from './components/RecordingScreen';
import DashboardScreen from './components/DashboardScreen';
import BodyScreen from './components/BodyScreen';
import BottomNav from './components/BottomNav';
import FilterBar from './components/FilterBar';
import { FilterState, initialFilterState, filterWorkouts, sortWorkouts } from './utils/filters';
import { Goal, UserPreferences, BodyComposition } from './types/workout';
import { STORAGE_KEYS } from './utils/storage';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUT_RECORDS, []);
  const [goals, setGoals] = useLocalStorage<Goal[]>(STORAGE_KEYS.WORKOUT_GOALS, [
    { id: '1', type: 'frequency', target: 20, period: 'month', startDate: new Date().toISOString() }
  ]);
  const [userPrefs, setUserPrefs] = useLocalStorage<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, {});
  const [darkMode, setDarkMode] = useLocalStorage<boolean>(STORAGE_KEYS.DARK_MODE, false);
  const [bodyComps, setBodyComps] = useLocalStorage<BodyComposition[]>(STORAGE_KEYS.BODY_COMPOSITIONS, []);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'recording' | 'dashboard' | 'body'>('recording');
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // Apply dark mode to body
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 1. Filter and Sort logic
  const filteredWorkouts = useMemo(() => {
    const filtered = filterWorkouts(workouts, filters);
    return sortWorkouts(filtered, filters.sortBy);
  }, [workouts, filters]);

  const addWorkout = (workout: Omit<Workout, 'id' | 'createdAt'>) => {
    const newWorkout: Workout = {
      ...workout,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setWorkouts([...workouts, newWorkout]);
  };

  const updateWorkout = (id: string, updatedFields: Partial<Workout>) => {
    setWorkouts(workouts.map(w => w.id === id ? { ...w, ...updatedFields } : w));
  };

  const deleteWorkout = (id: string) => {
    if (window.confirm('기록을 삭제하시겠습니까?')) {
      setWorkouts(workouts.filter(w => w.id !== id));
    }
  };

  const addBodyComp = (comp: Omit<BodyComposition, 'id' | 'createdAt'>) => {
    setBodyComps([...bodyComps, { ...comp, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  };

  const updateBodyComp = (id: string, updatedFields: Partial<BodyComposition>) => {
    setBodyComps(bodyComps.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const deleteBodyComp = (id: string) => {
    if (window.confirm('체성분 기록을 삭제하시겠습니까?')) {
      setBodyComps(bodyComps.filter(c => c.id !== id));
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors">
      {/* Shared Header or Filter at the top */}
      <div className="sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-30 pt-4 px-4 flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black tracking-tighter text-primary-600 dark:text-primary-400">ANTIGRAVITY WORKOUT</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600"
            >
              ⚙️
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400"
            >
              {darkMode ? <span className="text-xs">☀️ Light</span> : <span className="text-xs">🌙 Dark</span>}
            </button>
          </div>
        </div>
        <FilterBar filters={filters} onFilterChange={setFilters} />
      </div>

      <main>
        {activeTab === 'recording' ? (
          <RecordingScreen 
            workouts={filteredWorkouts} 
            onAdd={addWorkout} 
            onUpdate={updateWorkout}
            onDelete={deleteWorkout}
            userPrefs={userPrefs}
            onUpdatePrefs={(name, part) => setUserPrefs({ ...userPrefs, [name]: part })}
          />
        ) : activeTab === 'dashboard' ? (
          <DashboardScreen 
            workouts={filteredWorkouts} 
            goals={goals}
            onUpdateGoals={setGoals}
            bodyComps={bodyComps}
          />
        ) : (
          <BodyScreen
            bodyComps={bodyComps}
            onAdd={addBodyComp}
            onUpdate={updateBodyComp}
            onDelete={deleteBodyComp}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default App;
