import { Workout } from '../types/workout';

export const STORAGE_KEYS = {
  WORKOUT_RECORDS: 'workoutRecords',
  WORKOUT_GOALS: 'workoutGoals',
  USER_PREFERENCES: 'userPreferences',
  BODY_COMPOSITIONS: 'bodyCompositionRecords',
  DARK_MODE: 'darkMode'
};

const LEGACY_KEYS = {
  WORKOUT_RECORDS: 'workout-data',
  WORKOUT_GOALS: 'workout-goals',
  USER_PREFERENCES: 'user-preferences',
  BODY_COMPOSITIONS: 'body-compositions',
  DARK_MODE: 'dark-mode'
};

export const migrateStorage = () => {
  if (typeof window === 'undefined') return;

  // 1. Migrate workout records & convert legacy schema to setRecords
  const legacyWorkoutsStr = localStorage.getItem(LEGACY_KEYS.WORKOUT_RECORDS);
  const currentWorkoutsStr = localStorage.getItem(STORAGE_KEYS.WORKOUT_RECORDS);

  let workoutsData: Workout[] = [];

  if (currentWorkoutsStr) {
    try { workoutsData = JSON.parse(currentWorkoutsStr); } catch(e) { /* ignore */ }
  } else if (legacyWorkoutsStr) {
    try { workoutsData = JSON.parse(legacyWorkoutsStr); } catch(e) { /* ignore */ }
  }

  if (workoutsData && workoutsData.length > 0) {
    // Hard migrate all items to have setRecords
    const migratedWorkouts = workoutsData.map(w => {
      if (!w.setRecords || w.setRecords.length === 0) {
        const setsCount = w.sets || 3;
        const setRecords = Array.from({ length: setsCount }).map((_, i) => ({
          setNumber: i + 1,
          weight: w.weight || 0,
          reps: w.reps || 0
        }));
        return { ...w, setRecords };
      }
      return w;
    });

    localStorage.setItem(STORAGE_KEYS.WORKOUT_RECORDS, JSON.stringify(migratedWorkouts));
  }
  
  if (legacyWorkoutsStr && !currentWorkoutsStr) {
    // Migration was done from legacy, safely remove legacy key
    localStorage.removeItem(LEGACY_KEYS.WORKOUT_RECORDS);
  }

  // 2. Migrate other simple keys
  const simpleMigrations = [
    { old: LEGACY_KEYS.WORKOUT_GOALS, new: STORAGE_KEYS.WORKOUT_GOALS },
    { old: LEGACY_KEYS.USER_PREFERENCES, new: STORAGE_KEYS.USER_PREFERENCES },
    { old: LEGACY_KEYS.BODY_COMPOSITIONS, new: STORAGE_KEYS.BODY_COMPOSITIONS },
    { old: LEGACY_KEYS.DARK_MODE, new: STORAGE_KEYS.DARK_MODE }
  ];

  simpleMigrations.forEach(({ old, new: newKey }) => {
    const oldStr = localStorage.getItem(old);
    const newStr = localStorage.getItem(newKey);
    
    if (oldStr && !newStr) {
      localStorage.setItem(newKey, oldStr);
      localStorage.removeItem(old);
    }
  });
};

export const exportData = () => {
  const data = {
    [STORAGE_KEYS.WORKOUT_RECORDS]: JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKOUT_RECORDS) || '[]'),
    [STORAGE_KEYS.WORKOUT_GOALS]: JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKOUT_GOALS) || '[]'),
    [STORAGE_KEYS.USER_PREFERENCES]: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES) || '{}'),
    [STORAGE_KEYS.BODY_COMPOSITIONS]: JSON.parse(localStorage.getItem(STORAGE_KEYS.BODY_COMPOSITIONS) || '[]'),
    [STORAGE_KEYS.DARK_MODE]: JSON.parse(localStorage.getItem(STORAGE_KEYS.DARK_MODE) || 'false')
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `antigravity_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

export const importData = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation
        if (typeof data !== 'object') throw new Error('Invalid backup format');
        
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, JSON.stringify(data[key]));
        });
        resolve(true);
      } catch (err) {
        console.error('Import failed', err);
        resolve(false);
      }
    };
    reader.readAsText(file);
  });
};

export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
