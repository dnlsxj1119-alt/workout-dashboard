import React, { useState, useMemo } from 'react';
import { Workout, BodyPart, BODY_PARTS, UserPreferences } from '../types/workout';
import { Trash2, Edit3, Dumbbell, Sparkles, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { predictBodyPart } from '../utils/classification';
import { getPRRecords } from '../utils/stats';

interface RecordingScreenProps {
  workouts: Workout[];
  onAdd: (workout: Omit<Workout, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, workout: Partial<Workout>) => void;
  onDelete: (id: string) => void;
  userPrefs: UserPreferences;
  onUpdatePrefs: (name: string, part: BodyPart) => void;
}

const CATEGORY_MAP: Record<string, string[]> = {
  '가슴': ['벤치프레스', '인클라인벤치프레스', '펙덱플라이', '덤벨프레스'],
  '등': ['랫풀다운', '바벨로우', '덤벨로우', '시티드로우'],
  '어깨/팔': ['사레레', '숄더프레스', '바벨컬', '덤벨컬', '덤벨킥백'],
  '하체/힙': ['스쿼트', '레그컬', '레그익스텐션', '레그프레스', '힙쓰러스트'],
  '복근': ['크런치', '레그레이즈', '러시안트위스트'],
  '전신': ['데드리프트'],
  '유산소': ['러닝', '자전거']
};

const CATEGORY_TO_BODYPART: Record<string, BodyPart> = {
  '가슴': '가슴',
  '등': '등',
  '어깨/팔': '어깨', // Default to shoulder, predict will refine
  '하체/힙': '하체',
  '복근': '복근',
  '전신': '전신',
  '유산소': '유산소'
};

const RecordingScreen: React.FC<RecordingScreenProps> = ({ 
  workouts, onAdd, onUpdate, onDelete, userPrefs, onUpdatePrefs 
}) => {
  const [exercise, setExercise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('가슴');
  const [bodyPart, setBodyPart] = useState<BodyPart>('가슴');
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [sets, setSets] = useState<number>(1);
  const [memo, setMemo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Filter exercises: default + user custom exercises for this category
  const availableExercises = useMemo(() => {
    const defaults = CATEGORY_MAP[selectedCategory] || [];
    const customs = Object.entries(userPrefs)
      .filter(([_, part]) => {
        const catPart = CATEGORY_TO_BODYPART[selectedCategory];
        return part === catPart || (selectedCategory === '어깨/팔' && (part === '어깨' || part === '팔'));
      })
      .map(([name]) => name);
    
    // De-duplicate and return
    return Array.from(new Set([...defaults, ...customs]));
  }, [selectedCategory, userPrefs]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setBodyPart(CATEGORY_TO_BODYPART[cat]);
    setExercise('');
    setIsCustom(false);
  };

  const handleExerciseSelect = (ex: string) => {
    setExercise(ex);
    setIsCustom(false);
    // Predict body part precisely (e.g. Arms vs Shoulders)
    const predicted = predictBodyPart(ex, userPrefs);
    setBodyPart(predicted);
  };

  // PR detection for current exercise
  const isPotentialPR = useMemo(() => {
    if (!exercise || weight <= 0) return false;
    const prs = getPRRecords(workouts);
    const currentPR = prs.find(p => p.exercise.toLowerCase() === exercise.toLowerCase());
    return !currentPR || weight > currentPR.weight;
  }, [exercise, weight, workouts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise) return setError('운동을 선택하거나 입력해주세요.');
    if (weight < 0 || reps < 0 || sets < 1) return setError('올바른 수치를 입력해주세요.');
    
    setError('');

    if (editingId) {
      onUpdate(editingId, { exercise, bodyPart, weight, reps, sets, memo });
      setEditingId(null);
    } else {
      onAdd({ 
        date: new Date().toISOString(), 
        exercise, 
        bodyPart, 
        weight, 
        reps, 
        sets, 
        memo 
      });
      // Learn preference
      onUpdatePrefs(exercise.trim().toLowerCase().replace(/\s+/g, ''), bodyPart);
    }
    
    setExercise('');
    setIsCustom(false);
    setWeight(0);
    setReps(0);
    setSets(1);
    setMemo('');
  };

  const handleEdit = (w: Workout) => {
    setEditingId(w.id);
    setExercise(w.exercise);
    
    // Find category for the workout
    const cat = Object.entries(CATEGORY_MAP).find(([_, list]) => list.includes(w.exercise))?.[0] 
               || Object.entries(CATEGORY_TO_BODYPART).find(([_, bp]) => bp === w.bodyPart)?.[0] 
               || '가슴';
    
    setSelectedCategory(cat);
    setBodyPart(w.bodyPart);
    setWeight(w.weight);
    setReps(w.reps);
    setSets(w.sets);
    setMemo(w.memo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setExercise('');
    setIsCustom(false);
    setWeight(0);
    setReps(0);
    setSets(1);
    setMemo('');
  };

  return (
    <div className="flex flex-col gap-6 pb-32 animate-fade-in">
      <header className="px-6 py-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">운동 기록</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{format(new Date(), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}</p>
      </header>

      {/* Input Form */}
      <section className="px-4">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 flex flex-col gap-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Dumbbell size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {editingId ? '기록 수정' : '새 운동 기록'}
              </h2>
            </div>
            {isPotentialPR && !editingId && (
              <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full animate-bounce">
                <Sparkles size={10} /> NEW PR!
              </span>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-100 dark:border-rose-900/30">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* 1. Category Selection */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">부위 카테고리</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {Object.keys(CATEGORY_MAP).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                      selectedCategory === cat 
                        ? 'bg-slate-900 dark:bg-primary-600 text-white border-transparent shadow-lg' 
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Exercise Selection */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">운동 선택</label>
              <div className="flex flex-wrap gap-2">
                {availableExercises.map(ex => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleExerciseSelect(ex)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                      exercise === ex && !isCustom
                        ? 'bg-primary-600 text-white border-transparent shadow-md' 
                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setIsCustom(true); setExercise(''); }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border border-dashed ${
                    isCustom 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 text-primary-600' 
                      : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400 hover:border-primary-300 hover:text-primary-500'
                  }`}
                >
                  + 직접 추가
                </button>
              </div>
            </div>

            {/* 3. Custom Exercise Input (Conditional) */}
            {isCustom && (
              <div className="animate-slide-up">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">운동명 직접 입력</label>
                <input
                  type="text"
                  placeholder="운동 이름을 입력하세요"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-primary-100 dark:border-primary-900/30 rounded-[20px] focus:ring-0 focus:border-primary-500 outline-none transition-all dark:text-slate-100 text-sm font-bold"
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest text-center">무게</label>
                <input
                  type="number"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 text-center font-bold"
                  value={weight || ''}
                  onChange={(e) => setWeight(Number(e.target.value))}
                />
                <span className="block text-center text-[10px] font-bold text-slate-400 mt-1">kg</span>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest text-center">횟수</label>
                <input
                  type="number"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 text-center font-bold"
                  value={reps || ''}
                  onChange={(e) => setReps(Number(e.target.value))}
                />
                <span className="block text-center text-[10px] font-bold text-slate-400 mt-1">reps</span>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest text-center">세트</label>
                <input
                  type="number"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 text-center font-bold"
                  value={sets || ''}
                  onChange={(e) => setSets(Number(e.target.value))}
                />
                <span className="block text-center text-[10px] font-bold text-slate-400 mt-1">sets</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">메모</label>
              <textarea
                placeholder="운동 팁이나 메모..."
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-[20px] focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 text-sm min-h-[60px]"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold text-sm"
              >
                취소
              </button>
            )}
            <button type="submit" className="btn-primary flex-1 py-4 flex items-center justify-center gap-2">
              {editingId ? '수정 완료' : '운동 기록하기'}
            </button>
          </div>
        </form>
      </section>

      {/* History List */}
      <section className="px-4 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800 ml-2">필터링된 기록</h3>
        {workouts.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-white/40 rounded-[32px] border-2 border-dashed border-slate-200">
            <Dumbbell size={48} className="mb-4 opacity-20" />
            <p>아직 기록이 없습니다.</p>
            <p className="text-sm">오늘의 운동을 기록해보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {workouts.map((w) => (
              <div key={w.id} className="glass-card rounded-3xl p-5 animate-slide-up">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                      {w.bodyPart}
                    </span>
                    <h4 className="text-lg font-bold text-slate-800">{w.exercise}</h4>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(w)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(w.id)}
                      className="p-2 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-full transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 text-slate-600">
                  <div className="bg-slate-50 px-3 py-2 rounded-xl flex-1 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">무게</p>
                    <p className="font-bold">{w.weight}kg</p>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 rounded-xl flex-1 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">횟수</p>
                    <p className="font-bold">{w.reps}회</p>
                  </div>
                  <div className="bg-slate-50 px-3 py-2 rounded-xl flex-1 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">세트</p>
                    <p className="font-bold">{w.sets}세트</p>
                  </div>
                </div>
                
                {w.memo && (
                  <div className="mt-3 p-3 bg-amber-50/50 rounded-xl text-sm text-slate-600 border border-amber-100/50">
                    {w.memo}
                  </div>
                )}
                
                <div className="mt-3 text-[10px] text-slate-400 text-right italic">
                  {format(new Date(w.createdAt), 'yyyy.MM.dd HH:mm')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RecordingScreen;
