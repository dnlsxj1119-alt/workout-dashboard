import { 
  startOfDay, 
  startOfMonth, 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  parseISO,
  differenceInDays,
  subDays,
  format
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Workout } from '../types/workout';

// Helper to calculate volume for a single workout
export const calculateVolume = (w: Workout) => (w.weight || 0) * (w.reps || 0) * (w.sets || 0);

/**
 * Get stats for a specific date (defaults to today)
 */
export const getDailyStats = (workouts: Workout[], targetDate = new Date()) => {
  const dailyWorkouts = workouts.filter(w => isSameDay(parseISO(w.date), targetDate));
  const totalVolume = dailyWorkouts.reduce((sum, w) => sum + calculateVolume(w), 0);
  return {
    count: dailyWorkouts.length,
    totalVolume
  };
};

/**
 * Get stats for the current week
 */
export const getWeeklyStats = (workouts: Workout[], targetDate = new Date()) => {
  const weeklyWorkouts = workouts.filter(w => isSameWeek(parseISO(w.date), targetDate, { weekStartsOn: 1 }));
  const totalVolume = weeklyWorkouts.reduce((sum, w) => sum + calculateVolume(w), 0);
  
  // Unique workout days in this week
  const uniqueDays = new Set(weeklyWorkouts.map(w => format(parseISO(w.date), 'yyyy-MM-dd'))).size;

  return {
    count: uniqueDays,
    totalVolume
  };
};

/**
 * Get stats for the current month
 */
export const getMonthlyStats = (workouts: Workout[], targetDate = new Date()) => {
  const monthlyWorkouts = workouts.filter(w => isSameMonth(parseISO(w.date), targetDate));
  const totalVolume = monthlyWorkouts.reduce((sum, w) => sum + calculateVolume(w), 0);
  
  // Unique workout days in this month
  const uniqueDays = new Set(monthlyWorkouts.map(w => format(parseISO(w.date), 'yyyy-MM-dd'))).size;

  return {
    count: uniqueDays,
    totalVolume
  };
};

/**
 * Get distribution by body part
 */
export const getBodyPartStats = (workouts: Workout[]) => {
  const stats: Record<string, number> = {};
  workouts.forEach(w => {
    stats[w.bodyPart] = (stats[w.bodyPart] || 0) + 1;
  });

  const total = workouts.length;
  return Object.entries(stats).map(([name, count]) => ({
    name,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0
  })).sort((a, b) => b.count - a.count);
};

/**
 * Get stats per exercise
 */
export const getExerciseStats = (workouts: Workout[]) => {
  const stats: Record<string, { volume: number; count: number }> = {};
  workouts.forEach(w => {
    if (!stats[w.exercise]) stats[w.exercise] = { volume: 0, count: 0 };
    stats[w.exercise].volume += calculateVolume(w);
    stats[w.exercise].count += 1;
  });

  return Object.entries(stats).map(([name, data]) => ({
    name,
    ...data
  })).sort((a, b) => b.volume - a.volume);
};

/**
 * Get max weight (PR) for each exercise
 */
export const getPRRecords = (workouts: Workout[]) => {
  const prs: Record<string, { weight: number; date: string }> = {};
  workouts.forEach(w => {
    if (!prs[w.exercise] || w.weight > prs[w.exercise].weight) {
      prs[w.exercise] = { weight: w.weight, date: w.date };
    }
  });
  return Object.entries(prs).map(([exercise, data]) => ({
    exercise,
    ...data
  })).sort((a, b) => b.weight - a.weight);
};

/**
 * Get current workout streak and days since last workout
 */
export const getWorkoutStreak = (workouts: Workout[]) => {
  if (workouts.length === 0) return { streak: 0, daysSinceLast: null };

  const sortedDates = Array.from(new Set(
    workouts.map(w => format(startOfDay(parseISO(w.date)), 'yyyy-MM-dd'))
  )).sort((a, b) => b.localeCompare(a)); // Descending

  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const lastWorkoutDate = sortedDates[0];
  const daysSinceLast = differenceInDays(parseISO(today), parseISO(lastWorkoutDate));

  let streak = 0;
  let currentCheck = startOfDay(new Date());

  // If last workout was not today or yesterday, streak is broken
  if (daysSinceLast > 1) {
    return { streak: 0, daysSinceLast };
  }

  // Calculate streak
  for (let i = 0; i < 365; i++) { // Max 1 year check
    const dateStr = format(currentCheck, 'yyyy-MM-dd');
    if (sortedDates.includes(dateStr)) {
      streak++;
      currentCheck = subDays(currentCheck, 1);
    } else {
      // If we are checking "today" and it's not there, but "yesterday" is, the streak continues
      if (i === 0) {
        currentCheck = subDays(currentCheck, 1);
        continue;
      }
      break;
    }
  }

  return { streak, daysSinceLast };
};

/**
 * Get volume trend for the last 7 days
 */
export const getWeeklyVolumeTrend = (workouts: Workout[]) => {
  const trend = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const targetDate = subDays(today, i);
    const dateStr = format(targetDate, 'MM/dd');
    const dayName = format(targetDate, 'eee', { locale: ko });
    
    const volume = workouts
      .filter(w => isSameDay(parseISO(w.date), targetDate))
      .reduce((sum, w) => sum + calculateVolume(w), 0);
      
    trend.push({ 
      date: dateStr, 
      day: dayName,
      volume 
    });
  }
  return trend;
};

/**
 * Get monthly workout frequency for the last 6 months
 */
export const getMonthlyFrequencyTrend = (workouts: Workout[]) => {
  const trend = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const targetMonth = startOfMonth(subDays(today, i * 30)); // Rough month check
    const monthStr = format(targetMonth, 'M월');
    
    const uniqueDays = new Set(
      workouts
        .filter(w => isSameMonth(parseISO(w.date), targetMonth))
        .map(w => format(parseISO(w.date), 'yyyy-MM-dd'))
    ).size;
    
    trend.push({
      month: monthStr,
      count: uniqueDays
    });
  }
  return trend;
};

/**
 * Get activity flow for the last 7 days (binary: active or not)
 */
export const getActivityFlow = (workouts: Workout[]) => {
  const flow = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const targetDate = subDays(today, i);
    const dayName = format(targetDate, 'eee', { locale: ko });
    const isActive = workouts.some(w => isSameDay(parseISO(w.date), targetDate));
    
    flow.push({
      day: dayName,
      active: isActive
    });
  }
  return flow;
};

/**
 * Get heatmap data for the last N days (e.g., 90 days)
 */
export const getHeatmapData = (workouts: Workout[], days: number = 90) => {
  const data = [];
  const today = startOfDay(new Date());
  
  for (let i = days - 1; i >= 0; i--) {
    const targetDate = subDays(today, i);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const workoutCount = workouts.filter(w => isSameDay(parseISO(w.date), targetDate)).length;
    
    data.push({
      date: dateStr,
      count: workoutCount,
      level: workoutCount === 0 ? 0 : workoutCount < 3 ? 1 : workoutCount < 5 ? 2 : 3
    });
  }
  return data;
};

/**
 * Get ratio of weekend vs weekday workouts
 */
export const getWeekendRatio = (workouts: Workout[]) => {
  if (workouts.length === 0) return { weekend: 0, weekday: 0 };
  
  const uniqueWorkoutDays = Array.from(new Set(workouts.map(w => format(parseISO(w.date), 'yyyy-MM-dd'))));
  
  let weekendCount = 0;
  let weekdayCount = 0;
  
  uniqueWorkoutDays.forEach(dateStr => {
    const date = parseISO(dateStr);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    if (day === 0 || day === 6) weekendCount++;
    else weekdayCount++;
  });
  
  const total = uniqueWorkoutDays.length;
  return {
    weekend: Math.round((weekendCount / total) * 100),
    weekday: Math.round((weekdayCount / total) * 100)
  };
};
