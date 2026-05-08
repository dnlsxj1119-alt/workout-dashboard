import { 
  isSameDay, 
  isAfter, 
  subDays, 
  startOfMonth, 
  startOfYear, 
  parseISO 
} from 'date-fns';
import { Workout, BodyPart } from '../types/workout';
import { calculateVolume, getPRRecords } from './stats';

export type SortOption = 'latest' | 'oldest' | 'volume_desc' | 'weight_desc' | 'name_asc';

export interface FilterState {
  period: 'all' | 'today' | 'week' | 'month' | 'year';
  bodyPart: BodyPart | '전체';
  search: string;
  isPR: boolean;
  minVolume: number;
  sortBy: SortOption;
}

export const initialFilterState: FilterState = {
  period: 'all',
  bodyPart: '전체',
  search: '',
  isPR: false,
  minVolume: 0,
  sortBy: 'latest'
};

export const filterWorkouts = (workouts: Workout[], filters: FilterState) => {
  const globalPRs = getPRRecords(workouts);
  
  return workouts.filter(w => {
    const workoutDate = parseISO(w.date);
    const today = new Date();

    // 1. Period Filter
    if (filters.period === 'today' && !isSameDay(workoutDate, today)) return false;
    if (filters.period === 'week' && !isAfter(workoutDate, subDays(today, 7))) return false;
    if (filters.period === 'month' && !isAfter(workoutDate, startOfMonth(today))) return false;
    if (filters.period === 'year' && !isAfter(workoutDate, startOfYear(today))) return false;

    // 2. Body Part Filter
    if (filters.bodyPart !== '전체' && w.bodyPart !== filters.bodyPart) return false;

    // 3. Search Filter
    if (filters.search && !w.exercise.toLowerCase().includes(filters.search.toLowerCase())) return false;

    // 4. Min Volume Filter
    if (filters.minVolume > 0 && calculateVolume(w) < filters.minVolume) return false;

    // 5. PR Filter
    if (filters.isPR) {
      const pr = globalPRs.find(p => p.exercise === w.exercise);
      if (!pr || pr.weight !== w.weight || pr.date !== w.date) return false;
    }

    return true;
  });
};

export const sortWorkouts = (workouts: Workout[], sortBy: SortOption) => {
  return [...workouts].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return parseISO(b.date).getTime() - parseISO(a.date).getTime();
      case 'oldest':
        return parseISO(a.date).getTime() - parseISO(b.date).getTime();
      case 'volume_desc':
        return calculateVolume(b) - calculateVolume(a);
      case 'weight_desc':
        return b.weight - a.weight;
      case 'name_asc':
        return a.exercise.localeCompare(b.exercise);
      default:
        return 0;
    }
  });
};
