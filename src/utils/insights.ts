import { 
  subDays, 
  isWithinInterval, 
  parseISO, 
  startOfDay,
  differenceInDays
} from 'date-fns';
import { Workout, BodyPart } from '../types/workout';
import { calculateVolume, getWeeklyStats, getPRRecords } from './stats';

export interface Insight {
  id: string;
  title: string;
  value: string;
  description: string;
  action: string;
  type: 'positive' | 'warning' | 'info';
}

/**
 * Generate rule-based insights from workout data
 */
export const generateInsights = (workouts: Workout[]): Insight[] => {
  if (workouts.length < 5) return []; // Not enough data

  const insights: Insight[] = [];
  
  // 1. Weekly Volume Comparison
  const weeklyInsight = compareWeeklyVolume(workouts);
  if (weeklyInsight) insights.push(weeklyInsight);

  // 2. Body Part Imbalance
  const imbalanceInsight = detectBodyPartImbalance(workouts);
  if (imbalanceInsight) insights.push(imbalanceInsight);

  // 3. PR Detection
  const prInsight = detectRecentPR(workouts);
  if (prInsight) insights.push(prInsight);

  // 4. Workout Gap
  const gapInsight = detectWorkoutGap(workouts);
  if (gapInsight) insights.push(gapInsight);

  // 5. Exercise Progress
  const progressInsight = detectExerciseProgress(workouts);
  if (progressInsight) insights.push(progressInsight);

  return insights;
};

/**
 * Compare last 7 days volume with previous 7-14 days
 */
const compareWeeklyVolume = (workouts: Workout[]): Insight | null => {
  const now = new Date();
  const last7Days = workouts.filter(w => isWithinInterval(parseISO(w.date), { start: subDays(now, 7), end: now }));
  const prev7Days = workouts.filter(w => isWithinInterval(parseISO(w.date), { start: subDays(now, 14), end: subDays(now, 7) }));

  const lastVol = last7Days.reduce((sum, w) => sum + calculateVolume(w), 0);
  const prevVol = prev7Days.reduce((sum, w) => sum + calculateVolume(w), 0);

  if (prevVol === 0) return null;

  const diff = ((lastVol - prevVol) / prevVol) * 100;

  if (Math.abs(diff) > 10) {
    return {
      id: 'weekly-volume',
      title: '주간 훈련 강도 변화',
      value: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`,
      description: diff > 0 
        ? '지난주보다 더 강도 높은 훈련을 소화하고 있습니다!' 
        : '지난주 대비 전체 훈련량이 감소했습니다. 컨디션 조절 중이신가요?',
      action: diff > 0 ? '충분한 휴식과 영양 섭취를 잊지 마세요.' : '다시 점진적 과부하를 적용해볼까요?',
      type: diff > 0 ? 'positive' : 'info'
    };
  }
  return null;
};

/**
 * Detect if some major body parts are neglected
 */
const detectBodyPartImbalance = (workouts: Workout[]): Insight | null => {
  const last30Days = workouts.filter(w => isWithinInterval(parseISO(w.date), { start: subDays(new Date(), 30), end: new Date() }));
  if (last30Days.length < 10) return null;

  const counts: Record<string, number> = {};
  last30Days.forEach(w => {
    counts[w.bodyPart] = (counts[w.bodyPart] || 0) + 1;
  });

  const majorParts: BodyPart[] = ['가슴', '등', '하체'];
  const total = last30Days.length;

  for (const part of majorParts) {
    const ratio = (counts[part] || 0) / total;
    if (ratio < 0.1) { // Less than 10%
      return {
        id: `imbalance-${part}`,
        title: '부위별 불균형 감지',
        value: `${part} 소홀`,
        description: `최근 30일간 ${part} 운동 비중이 너무 낮습니다 (전체의 ${(ratio * 100).toFixed(0)}%).`,
        action: `균형 잡힌 발달을 위해 다음 운동에는 ${part}을(를) 포함해 보세요.`,
        type: 'warning'
      };
    }
  }
  return null;
};

/**
 * Detect if a PR was set in the last 3 days
 */
const detectRecentPR = (workouts: Workout[]): Insight | null => {
  const prs = getPRRecords(workouts);
  const recentPR = prs.find(pr => isWithinInterval(parseISO(pr.date), { start: subDays(new Date(), 3), end: new Date() }));

  if (recentPR) {
    return {
      id: 'recent-pr',
      title: '새로운 정점 도달',
      value: `${recentPR.exercise} PR`,
      description: `최근 ${recentPR.exercise}에서 개인 최고 중량(${recentPR.weight}kg)을 경신하셨습니다!`,
      action: '대단합니다! 기록을 축하하며 안전하게 다음 단계를 준비하세요.',
      type: 'positive'
    };
  }
  return null;
};

/**
 * Detect if workout gap is increasing
 */
const detectWorkoutGap = (workouts: Workout[]): Insight | null => {
  if (workouts.length < 10) return null;
  
  const sorted = [...workouts].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  const lastWorkout = parseISO(sorted[0].date);
  const daysSince = differenceInDays(startOfDay(new Date()), startOfDay(lastWorkout));

  if (daysSince >= 4) {
    return {
      id: 'workout-gap',
      title: '휴식 기간 연장됨',
      value: `${daysSince}일째 휴식`,
      description: '마지막 운동으로부터 시간이 꽤 지났습니다. 근육이 충분히 쉬었을 거예요.',
      action: '오늘 가벼운 맨몸 운동부터 다시 시작해보는 건 어떨까요?',
      type: 'warning'
    };
  }
  return null;
};

/**
 * Detect significant progress in a specific exercise
 */
const detectExerciseProgress = (workouts: Workout[]): Insight | null => {
  const exercises = Array.from(new Set(workouts.map(w => w.exercise)));
  
  for (const ex of exercises) {
    const exWorkouts = workouts.filter(w => w.exercise === ex);
    if (exWorkouts.length < 5) continue;

    const last3 = exWorkouts.slice(-3).reduce((sum, w) => sum + calculateVolume(w), 0) / 3;
    const prev3 = exWorkouts.slice(-6, -3).reduce((sum, w) => sum + calculateVolume(w), 0) / 3;

    if (prev3 > 0 && (last3 - prev3) / prev3 > 0.2) {
      return {
        id: `progress-${ex}`,
        title: '급격한 성장 포착',
        value: `${ex} 볼륨 상승`,
        description: `${ex}의 최근 평균 볼륨이 이전 대비 20% 이상 증가했습니다.`,
        action: '자세가 흐트러지지 않도록 주의하며 꾸준히 밀고 나가세요.',
        type: 'positive'
      };
    }
  }
  return null;
};
