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

const RecordingScreen: React.FC<RecordingScreenProps> = ({ 
  workouts, onAdd, onUpdate, onDelete, userPrefs, onUpdatePrefs 
}) => {
  const [exercise, setExercise] = useState('');
  const [bodyPart, setBodyPart] = useState<BodyPart>('가슴');
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [sets, setSets] = useState<number>(1);
  const [memo, setMemo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Auto-classify when exercise name changes
  const handleExerciseChange = (name: string) => {
    setExercise(name);
    const predicted = predictBodyPart(name, userPrefs);
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
    if (!exercise) return setError('운동 명을 입력해주세요.');
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
    setWeight(0);
    setReps(0);
    setSets(1);
    setMemo('');
  };

  const handleEdit = (w: Workout) => {
    setEditingId(w.id);
    setExercise(w.exercise);
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
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 flex flex-col gap-4 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
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

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">운동 명</label>
              <input
                type="text"
                list="common-exercises"
                placeholder="예: 벤치 프레스"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-200"
                value={exercise}
                onChange={(e) => handleExerciseChange(e.target.value)}
                required
              />
              <datalist id="common-exercises">
                <option value="벤치프레스" />
                <option value="인클라인벤치프레스" />
                <option value="펙덱플라이" />
                <option value="덤벨프레스" />
                <option value="사레레" />
                <option value="숄더프레스" />
                <option value="바벨컬" />
                <option value="덤벨컬" />
                <option value="덤벨킥백" />
                <option value="랫풀다운" />
                <option value="바벨로우" />
                <option value="덤벨로우" />
                <option value="시티드로우" />
                <option value="스쿼트" />
                <option value="레그컬" />
                <option value="레그익스텐션" />
                <option value="레그프레스" />
                <option value="힙쓰러스트" />
                <option value="크런치" />
                <option value="레그레이즈" />
                <option value="러시안트위스트" />
                <option value="데드리프트" />
                <option value="러닝" />
                <option value="자전거" />
              </datalist>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">부위 선택 (자동 분류)</label>
              <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                {BODY_PARTS.map(part => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setBodyPart(part)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      bodyPart === part 
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">무게(kg)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-200"
                  value={weight || ''}
                  onChange={(e) => setWeight(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">횟수</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-200"
                  value={reps || ''}
                  onChange={(e) => setReps(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">세트</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-200"
                  value={sets || ''}
                  onChange={(e) => setSets(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">메모</label>
              <textarea
                placeholder="간단한 메모..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-200 min-h-[60px]"
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
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold text-sm"
              >
                취소
              </button>
            )}
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
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
