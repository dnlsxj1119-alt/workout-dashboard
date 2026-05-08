import { BodyPart } from '../types/workout';

// Initial mapping for automatic classification
const INITIAL_MAPPING: Record<string, BodyPart> = {
  // 가슴
  '벤치프레스': '가슴',
  '인클라인벤치프레스': '가슴',
  '펙덱플라이': '가슴',
  '덤벨프레스': '가슴',
  // 어깨/팔
  '사레레': '어깨',
  '사이드레터럴레이즈': '어깨',
  '숄더프레스': '어깨',
  '바벨컬': '팔',
  '덤벨컬': '팔',
  '덤벨킥백': '팔',
  // 등
  '랫풀다운': '등',
  '바벨로우': '등',
  '덤벨로우': '등',
  '시티드로우': '등',
  // 하체/힙
  '스쿼트': '하체',
  '레그컬': '하체',
  '레그익스텐션': '하체',
  '레그프레스': '하체',
  '힙쓰러스트': '하체',
  // 복근
  '크런치': '복근',
  '레그레이즈': '복근',
  '러시안트위스트': '복근',
  // 전신
  '데드리프트': '전신',
  // 유산소
  '러닝': '유산소',
  '자전거': '유산소',
  '사이클': '유산소',
};

/**
 * Predict body part based on exercise name and user preferences
 */
export const predictBodyPart = (
  exerciseName: string, 
  userPrefs: Record<string, BodyPart> = {}
): BodyPart => {
  const name = exerciseName.trim().toLowerCase().replace(/\s+/g, '');
  if (!name) return '가슴';
  
  // 1. Check user preferences first (exact match or includes)
  if (userPrefs[name]) return userPrefs[name];
  
  // Try partial match in user preferences
  for (const [key, part] of Object.entries(userPrefs)) {
    if (name.includes(key) || key.includes(name)) return part;
  }

  // 2. Check initial mapping (partial match)
  for (const [key, part] of Object.entries(INITIAL_MAPPING)) {
    if (name.includes(key) || key.includes(name)) return part;
  }

  return '가슴'; // Default
};
