import React, { useState, useMemo } from 'react';
import { Workout } from './types/workout';
import { useLocalStorage } from './hooks/useLocalStorage';
import RecordingScreen from './components/RecordingScreen';
import DashboardScreen from './components/DashboardScreen';
import BottomNav from './components/BottomNav';
import FilterBar from './components/FilterBar';
import { FilterState, initialFilterState, filterWorkouts, sortWorkouts } from './utils/filters';
import { Goal, UserPreferences } from './types/workout';

const App: React.FC = () => {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('workout-data', []);
  const [goals, setGoals] = useLocalStorage<Goal[]>('workout-goals', [
    { id: '1', type: 'frequency', target: 20, period: 'month', startDate: new Date().toISOString() }
  ]);
  const [userPrefs, setUserPrefs] = useLocalStorage<UserPreferences>('user-preferences', {});
  const [darkMode, setDarkMode] = useLocalStorage<boolean>('dark-mode', false);
  
  const [activeTab, setActiveTab] = useState<'recording' | 'dashboard'>('recording');
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

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-24 transition-colors">
      {/* Shared Header or Filter at the top */}
      <div className="sticky top-0 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md z-30 pt-4 px-4 flex flex-col gap-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black tracking-tighter text-primary-600 dark:text-primary-400">ANTIGRAVITY WORKOUT</span>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400"
          >
            {darkMode ? <span className="text-xs">☀️ Light</span> : <span className="text-xs">🌙 Dark</span>}
          </button>
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
        ) : (
          <DashboardScreen 
            workouts={filteredWorkouts} 
            goals={goals}
            onUpdateGoals={setGoals}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
