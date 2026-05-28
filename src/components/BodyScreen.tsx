import React, { useState, useMemo } from 'react';
import { BodyComposition } from '../types/workout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, Plus, X, AlertCircle, Trash2, Edit3, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface BodyScreenProps {
  bodyComps: BodyComposition[];
  onAdd: (comp: Omit<BodyComposition, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, comp: Partial<BodyComposition>) => void;
  onDelete: (id: string) => void;
}

const BodyScreen: React.FC<BodyScreenProps> = ({ bodyComps, onAdd, onUpdate, onDelete }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight] = useState<number | ''>('');
  const [skeletalMuscle, setSkeletalMuscle] = useState<number | ''>('');
  const [bodyFat, setBodyFat] = useState<number | ''>('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState<number | ''>('');
  const [error, setError] = useState('');

  // Sort by date ascending for chart
  const chartData = useMemo(() => {
    return [...bodyComps].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(comp => ({
      ...comp,
      dateLabel: format(parseISO(comp.date), 'MM.dd')
    }));
  }, [bodyComps]);

  // Sort by date descending for list
  const listData = useMemo(() => {
    return [...bodyComps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bodyComps]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight && !skeletalMuscle && !bodyFat && !bodyFatPercentage) {
      return setError('최소 하나의 데이터는 입력해주세요.');
    }
    
    setError('');

    const newComp = {
      date: new Date(date).toISOString(),
      weight: weight === '' ? undefined : Number(weight),
      skeletalMuscle: skeletalMuscle === '' ? undefined : Number(skeletalMuscle),
      bodyFat: bodyFat === '' ? undefined : Number(bodyFat),
      bodyFatPercentage: bodyFatPercentage === '' ? undefined : Number(bodyFatPercentage),
    };

    if (editingId) {
      onUpdate(editingId, newComp);
      setEditingId(null);
    } else {
      onAdd(newComp);
    }
    
    resetForm();
    setIsFormVisible(false);
  };

  const handleEdit = (comp: BodyComposition) => {
    setIsFormVisible(true);
    setEditingId(comp.id);
    setDate(format(parseISO(comp.date), 'yyyy-MM-dd'));
    setWeight(comp.weight ?? '');
    setSkeletalMuscle(comp.skeletalMuscle ?? '');
    setBodyFat(comp.bodyFat ?? '');
    setBodyFatPercentage(comp.bodyFatPercentage ?? '');
  };

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setWeight('');
    setSkeletalMuscle('');
    setBodyFat('');
    setBodyFatPercentage('');
    setEditingId(null);
    setError('');
  };

  const toggleForm = () => {
    if (isFormVisible && !editingId) {
      setIsFormVisible(false);
    } else {
      setIsFormVisible(true);
      resetForm();
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-32 animate-fade-in relative">
      <header className="px-6 py-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">체성분 기록</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">나의 몸 변화 추적</p>
        </div>
      </header>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <section className="px-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Scale size={16} className="text-primary-500" /> 변화 추이
              </h3>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-10" />
                  <XAxis 
                    dataKey="dateLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis yAxisId="left" hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <YAxis yAxisId="right" orientation="right" hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#fff' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="체중(kg)" />
                  <Line yAxisId="right" type="monotone" dataKey="bodyFatPercentage" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} name="체지방률(%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                <span className="text-[10px] font-bold text-slate-500">체중</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                <span className="text-[10px] font-bold text-slate-500">체지방률</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* List Section */}
      <section className="px-6 flex flex-col gap-4">
        {listData.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 bg-white/40 dark:bg-slate-900/40 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Scale size={48} className="mb-4 opacity-20" />
            <p>아직 기록이 없습니다.</p>
            <p className="text-sm mt-1 mb-4">첫 체성분을 기록해보세요!</p>
            <button 
              onClick={toggleForm}
              className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold flex items-center gap-2"
            >
              <Plus size={18} /> 새 기록 추가
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listData.map((comp) => (
              <div key={comp.id} className="bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {format(parseISO(comp.date), 'yyyy년 MM월 dd일')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(comp)}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete(comp.id)}
                      className="p-2 text-slate-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-full transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {comp.weight !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">체중</p>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{comp.weight}kg</p>
                    </div>
                  )}
                  {comp.bodyFatPercentage !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">체지방률</p>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{comp.bodyFatPercentage}%</p>
                    </div>
                  )}
                  {comp.skeletalMuscle !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">골격근량</p>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{comp.skeletalMuscle}kg</p>
                    </div>
                  )}
                  {comp.bodyFat !== undefined && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">체지방량</p>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{comp.bodyFat}kg</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      {!isFormVisible && (
        <button 
          onClick={toggleForm}
          className="fixed bottom-[110px] right-6 w-14 h-14 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-xl shadow-primary-600/30 hover:scale-105 transition-transform z-40"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Full Screen Modal Form */}
      {isFormVisible && (
        <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col animate-slide-up overflow-y-auto pb-safe">
          <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {editingId ? '체성분 기록 수정' : '체성분 기록 추가'}
            </h2>
            <button onClick={toggleForm} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">측정 날짜</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 font-bold"
                  value={date}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">체중 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 font-bold text-lg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">체지방률 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 font-bold text-lg"
                  value={bodyFatPercentage}
                  onChange={(e) => setBodyFatPercentage(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">골격근량 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 font-bold text-lg"
                  value={skeletalMuscle}
                  onChange={(e) => setSkeletalMuscle(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-2 block tracking-widest">체지방량 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-slate-100 font-bold text-lg"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.0"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-4 mt-4">
              저장하기
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BodyScreen;
