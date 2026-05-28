export interface Workout {
  id: string;
  date: string; // ISO string
  exercise: string;
  bodyPart: BodyPart;
  weight: number;
  reps: number;
  sets: number;
  memo: string;
  createdAt: string; // ISO string
}

export type BodyPart = '가슴' | '등' | '어깨' | '팔' | '하체' | '복근' | '전신' | '유산소' | '기타';

export const BODY_PARTS: BodyPart[] = ['가슴', '등', '어깨', '팔', '하체', '복근', '전신', '유산소', '기타'];

export interface Goal {
  id: string;
  type: 'volume' | 'frequency';
  target: number;
  period: 'month';
  bodyPart?: BodyPart | '전체';
  startDate: string;
}

export type UserPreferences = Record<string, BodyPart>;

export interface BodyComposition {
  id: string;
  date: string;
  weight?: number;
  skeletalMuscle?: number;
  bodyFat?: number;
  bodyFatPercentage?: number;
  createdAt: string;
}
