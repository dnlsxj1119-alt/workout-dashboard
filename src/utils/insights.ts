import { 
  subDays, 
  isWithinInterval, 
  parseISO, 
  format
} from 'date-fns';
import { Workout } from '../types/workout';
import { getPRRecords, getWorkoutStreak, getWeekendRatio } from './stats';

export interface Insight {
  id: string;
  title: string;
  value: string;
  description: string;
  action: string;
  type: 'positive' | 'warning' | 'info';
}

/**
 * Generate habit-focused insights from workout data
 */
export const generateInsights = (workouts: Workout[]): Insight[] => {
  if (workouts.length === 0) return [{
    id: 'welcome',
    title: '새로운 시작',
    value: '오늘이 1일차!',
    description: '첫 운동을 기록해주세요. 작은 시작이 큰 변화를 만듭니다.',
    action: '지금 바로 첫 기록 남기기',
    type: 'info'
  }];

  const insights: Insight[] = [];
  
  // 1. Streak Insight
  const streakInsight = analyzeStreak(workouts);
  if (streakInsight) insights.push(streakInsight);

  // 2. Frequency Insight
  const freqInsight = analyzeFrequency(workouts);
  if (freqInsight) insights.push(freqInsight);

  // 3. Habit (Weekend vs Weekday) Insight
  const habitInsight = analyzeHabit(workouts);
  if (habitInsight) insights.push(habitInsight);

  // 4. PR / Growth Insight
  const growthInsight = analyzeGrowth(workouts);
  if (growthInsight) insights.push(growthInsight);

  // 5. Body Part Preference
  const preferenceInsight = analyzePreference(workouts);
  if (preferenceInsight) insights.push(preferenceInsight);

  return insights;
};

const analyzeStreak = (workouts: Workout[]): Insight | null => {
  const { streak, daysSinceLast } = getWorkoutStreak(workouts);
  
  if (streak >= 3) {
    return {
      id: 'streak-fire',
      title: '미친 꾸준함 🔥',
      value: `${streak}일 연속`,
      description: `${streak}일 연속으로 운동하셨네요! 이 흐름 절대 끊기지 않게 오늘도 화이팅!`,
      action: '오늘도 기록 달성하러 가기',
      type: 'positive'
    };
  }
  
  if (daysSinceLast && daysSinceLast >= 3) {
    return {
      id: 'streak-gap',
      title: '휴식이 길어지고 있어요',
      value: `${daysSinceLast}일째 휴식`,
      description: '충분히 쉬셨다면, 오늘은 가볍게 몸을 풀어보는 건 어떨까요?',
      action: '짧게라도 땀 흘려보기',
      type: 'warning'
    };
  }
  
  return null;
};

const analyzeFrequency = (workouts: Workout[]): Insight | null => {
  const now = new Date();
  const last7Days = new Set(
    workouts
      .filter(w => isWithinInterval(parseISO(w.date), { start: subDays(now, 7), end: now }))
      .map(w => format(parseISO(w.date), 'yyyy-MM-dd'))
  ).size;

  if (last7Days >= 4) {
    return {
      id: 'high-freq',
      title: '훌륭한 루틴',
      value: `주 ${last7Days}회`,
      description: `최근 7일 중 ${last7Days}일을 운동에 투자하셨어요. 완벽한 루틴이 자리 잡았습니다!`,
      action: '이 페이스 그대로 유지하기',
      type: 'positive'
    };
  }
  
  return null;
};

const analyzeHabit = (workouts: Workout[]): Insight | null => {
  const ratio = getWeekendRatio(workouts);
  if (ratio.weekend > 50) {
    return {
      id: 'weekend-warrior',
      title: '주말의 전사',
      value: '주말 비중 높음',
      description: `주말에 운동하는 비율이 ${ratio.weekend}%로 매우 높습니다. 바쁜 평일을 지나 주말을 알차게 보내고 계시네요!`,
      action: '평일에도 가벼운 스트레칭 추가해보기',
      type: 'info'
    };
  }
  return null;
};

const analyzeGrowth = (workouts: Workout[]): Insight | null => {
  const prs = getPRRecords(workouts);
  const recentPR = prs.find(pr => isWithinInterval(parseISO(pr.date), { start: subDays(new Date(), 3), end: new Date() }));

  if (recentPR) {
    return {
      id: 'recent-pr',
      title: '성장의 증명',
      value: 'NEW PR!',
      description: `최근 ${recentPR.exercise}에서 ${recentPR.weight}kg의 새로운 기록을 세우셨어요. 분명히 어제보다 강해졌습니다.`,
      action: '기록 경신 축하합니다 🎉',
      type: 'positive'
    };
  }
  return null;
};

const analyzePreference = (workouts: Workout[]): Insight | null => {
  if (workouts.length < 5) return null;
  
  const counts: Record<string, number> = {};
  workouts.forEach(w => {
    counts[w.bodyPart] = (counts[w.bodyPart] || 0) + 1;
  });
  
  const topPart = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  
  if (topPart && topPart[1] / workouts.length > 0.4) {
    return {
      id: 'pref-part',
      title: '당신의 최애 운동',
      value: `${topPart[0]} 집중`,
      description: `전체 운동 중 ${topPart[0]} 운동 비중이 제일 높네요! 득근을 향한 열정이 돋보입니다.`,
      action: '다른 부위도 골고루 섞어주면 더 좋아요',
      type: 'info'
    };
  }
  
  return null;
};
