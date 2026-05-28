import React, { useState, useMemo, useRef } from 'react';
import { Workout, BodyPart, UserPreferences } from '../types/workout';
import { Trash2, Edit3, Dumbbell, Sparkles, AlertCircle, Plus, X, Calendar as CalendarIcon, Minus, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exercise, setExercise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('가슴');
  const [bodyPart, setBodyPart] = useState<BodyPart>('가슴');
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [sets, setSets] = useState<number>(3);
  const [memo, setMemo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const renderMemoWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary-600 dark:text-primary-400 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };
  
  const formRef = useRef<HTMLDivElement>(null);

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
    if (!exercise) {
      setError('운동을 선택하거나 입력해주세요.');
      showToast('필수 정보를 확인해주세요 (운동 선택)', 'error');
      return;
    }
    if (weight < 0 || reps < 0 || sets < 1) {
      setError('올바른 수치를 입력해주세요.');
      showToast('필수 정보를 확인해주세요 (수치 입력)', 'error');
      return;
    }
    
    setError('');

    if (editingId) {
      onUpdate(editingId, { date: new Date(date).toISOString(), exercise, bodyPart, weight, reps, sets, memo });
      setEditingId(null);
    } else {
      onAdd({ 
        date: new Date(date).toISOString(), 
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
    
    // Reset form but keep date and category for rapid entry
    setExercise('');
    setIsCustom(false);
    setWeight(0);
    setReps(0);
    setMemo('');
    
    showToast('기록이 저장되었습니다', 'success');
    
    // Hide form if it was an edit, otherwise keep it open for multiple entries
    if (editingId) setIsFormVisible(false);
    
    // Scroll to top of list after saving
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (w: Workout) => {
    setIsFormVisible(true);
    setEditingId(w.id);
    setDate(format(parseISO(w.date), 'yyyy-MM-dd'));
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
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setExercise('');
    setIsCustom(false);
    setWeight(0);
    setReps(0);
    setSets(3);
    setMemo('');
    setIsFormVisible(false);
  };

  const toggleForm = () => {
    if (isFormVisible && !editingId) {
      setIsFormVisible(false);
    } else {
      // Reset form state for new entry
      setEditingId(null);
      setExercise('');
      setIsCustom(false);
      setWeight(0);
      setReps(0);
      setSets(3);
      setMemo('');
      setIsFormVisible(true);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-32 animate-fade-in relative">
      <header className="px-6 py-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">운동 기록</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">총 {workouts.length}개의 기록</p>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-full shadow-lg flex items-center gap-2 animate-slide-up ${
          toast.type === 'success' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-rose-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold whitespace-nowrap">{toast.message}</span>
        </div>
      )}

      {/* History List - First in the flow */}
      <section className="px-4 flex flex-col gap-4">
        {workouts.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-white/40 dark:bg-slate-900/40 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Dumbbell size={48} className="mb-4 opacity-20" />
            <p>아직 기록이 없습니다.</p>
            <p className="text-sm mt-1 mb-4">첫 운동을 기록해보세요!</p>
            {!isFormVisible && (
              <button 
                onClick={toggleForm}
                className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold flex items-center gap-2"
              >
                <Plus size={18} /> 새 운동 추가하기
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {workouts.map((w) => (
              <div key={w.id} className="glass-card rounded-3xl p-5 animate-slide-up bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
                      {w.bodyPart}
                    </span>
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{w.exercise}</h4>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(w)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(w.id)}
                      className="p-2 text-slate-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-full transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 text-slate-600 dark:text-slate-300">
                  <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl flex-1 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">무게</p>
                    <p className="font-bold">{w.weight}kg</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl flex-1 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">횟수</p>
                    <p className="font-bold">{w.reps}회</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl flex-1 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">세트</p>
                    <p className="font-bold">{w.sets}세트</p>
                  </div>
                </div>
                
                {w.memo && (
                  <div className="mt-3 p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl text-sm text-slate-600 dark:text-slate-300 border border-amber-100/50 dark:border-amber-900/30 whitespace-pre-wrap">
                    {renderMemoWithLinks(w.memo)}
                  </div>
                )}
                
                <div className="mt-3 flex justify-between items-center text-[10px] text-slate-400 italic">
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={12} /> {format(parseISO(w.date), 'yyyy.MM.dd')}
                  </span>
                  <span>{format(parseISO(w.createdAt), 'HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Full Screen Modal Form */}
      {isFormVisible && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[60] flex flex-col animate-slide-up overflow-y-auto pb-safe">
          <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Dumbbell size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {editingId ? '기록 수정' : '새 운동 추가'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isPotentialPR && !editingId && (
                <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full animate-bounce">
                  <Sparkles size={10} /> NEW PR!
                </span>
              )}
              <button type="button" onClick={cancelEdit} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <X size={16} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-100 dark:border-rose-900/30">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="flex flex-col gap-5">
              {/* 0. Date Selection */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">운동 날짜</label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 text-sm font-bold appearance-none"
                    value={date}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <CalendarIcon className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* 1. Category Selection */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">부위 카테고리</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.keys(CATEGORY_MAP).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-3 rounded-2xl text-xs font-bold transition-all border ${
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

              {/* 4. Values Input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest text-center">무게 (kg)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 text-center font-bold text-lg"
                    value={weight || ''}
                    onChange={(e) => setWeight(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest text-center">횟수 (reps)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 text-center font-bold text-lg"
                    value={reps || ''}
                    onChange={(e) => setReps(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* 5. Sets Stepper */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest text-center">세트 수</label>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-3xl">
                  <button 
                    type="button"
                    onClick={() => setSets(Math.max(1, sets - 1))}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex-1 text-center font-black text-2xl text-slate-800 dark:text-slate-100">
                    {sets} <span className="text-sm font-bold text-slate-400">sets</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSets(sets + 1)}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600"
                  >
                    <Plus size={20} />
                  </button>
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

            <div className="flex mt-4 mb-24">
              <button 
                type="submit" 
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary-500/20 active:scale-95 transition-transform"
              >
                {editingId ? '수정 완료' : '기록 저장하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Action Button (Optional based on scroll/preference, but header has one too) */}
      {!isFormVisible && (
        <button 
          onClick={toggleForm}
          className="fixed bottom-[110px] right-6 w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-xl shadow-primary-600/30 hover:scale-105 transition-transform z-40"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

export default RecordingScreen;
