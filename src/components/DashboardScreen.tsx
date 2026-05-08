import React, { useMemo } from 'react';
import { Workout } from '../types/workout';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Calendar, Flame, Trophy, BarChart3, PieChart as PieIcon, Activity, Download, Flag, CheckCircle2
} from 'lucide-react';
import { 
  getDailyStats, 
  getWeeklyStats, 
  getMonthlyStats, 
  getBodyPartStats, 
  getPRRecords, 
  getWorkoutStreak,
  getExerciseStats,
  getWeeklyVolumeTrend,
  getMonthlyFrequencyTrend,
  getActivityFlow
} from '../utils/stats';
import { generateInsights, Insight } from '../utils/insights';
import { Lightbulb, ChevronRight, Info } from 'lucide-react';
import { Goal } from '../types/workout';

interface DashboardScreenProps {
  workouts: Workout[];
  goals: Goal[];
  onUpdateGoals: (goals: Goal[]) => void;
}

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
  const typeColors = {
    positive: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'
  };

  const iconColors = {
    positive: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  };

  return (
    <div className={`min-w-[280px] p-5 rounded-[32px] border ${typeColors[insight.type]} animate-fade-in`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`w-8 h-8 rounded-full ${iconColors[insight.type]} flex items-center justify-center text-white shadow-sm`}>
          <Lightbulb size={16} fill="currentColor" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{insight.title}</span>
      </div>
      <p className="text-2xl font-black mb-1">{insight.value}</p>
      <p className="text-xs font-medium leading-relaxed opacity-80 mb-4">{insight.description}</p>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
        <ChevronRight size={14} /> {insight.action}
      </div>
    </div>
  );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ workouts, goals }) => {
  // Memoized data calculations
  const weekly = useMemo(() => getWeeklyStats(workouts), [workouts]);
  const monthly = useMemo(() => getMonthlyStats(workouts), [workouts]);
  const bodyPartStats = useMemo(() => getBodyPartStats(workouts), [workouts]);
  const prs = useMemo(() => getPRRecords(workouts).slice(0, 3), [workouts]);
  const { streak, daysSinceLast } = useMemo(() => getWorkoutStreak(workouts), [workouts]);
  const weeklyTrend = useMemo(() => getWeeklyVolumeTrend(workouts), [workouts]);
  const activityFlow = useMemo(() => getActivityFlow(workouts), [workouts]);
  
  const insights = useMemo(() => generateInsights(workouts), [workouts]);

  const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

  const exportToCSV = () => {
    const headers = ['id', 'date', 'exercise', 'bodyPart', 'weight', 'reps', 'sets', 'memo'];
    const csvRows = [headers.join(',')];
    
    workouts.forEach(w => {
      csvRows.push([
        w.id,
        w.date,
        `"${w.exercise}"`,
        w.bodyPart,
        w.weight,
        w.reps,
        w.sets,
        `"${w.memo || ''}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workouts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const isEmpty = workouts.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[32px] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
          <BarChart3 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">기록을 기다리고 있어요</h2>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
          오늘의 첫 운동을 기록하면<br/>멋진 대시보드가 활성화됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-32 animate-fade-in bg-slate-50 dark:bg-slate-950 transition-colors">
      <header className="px-6 py-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">분석 통계</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">필터링된 데이터 기반 리포트</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400"
        >
          <Download size={18} />
        </button>
      </header>

      {/* Goal Tracking */}
      {goals.length > 0 && (
        <section className="px-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Flag size={16} className="text-primary-500" /> 월간 목표 달성도
              </h3>
              <span className="text-[10px] font-bold text-primary-500">
                {Math.min(100, Math.round((monthly.totalVolume / goals[0].target) * 100))}%
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-primary-500 transition-all duration-1000" 
                style={{ width: `${Math.min(100, (monthly.totalVolume / goals[0].target) * 100)}%` }} 
              />
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-slate-400">현재 {monthly.totalVolume.toLocaleString()}kg</p>
                <p className="text-[10px] text-slate-400">목표 {goals[0].target.toLocaleString()}kg</p>
              </div>
              {monthly.totalVolume >= goals[0].target && (
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full uppercase">
                  <CheckCircle2 size={12} /> GOAL REACHED!
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Insights Section */}
      <section className="px-6 flex flex-col gap-3">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">오늘의 인사이트</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <div key={insight.id} className="snap-center">
                <InsightCard insight={insight} />
              </div>
            ))
          ) : (
            <div className="w-full p-8 bg-slate-100 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-4 text-slate-400">
              <Info size={24} />
              <p className="text-xs font-medium leading-relaxed">
                데이터를 조금 더 쌓으면<br/>맞춤형 인사이트를 분석해 드릴게요!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Highlights: Streak & Last Activity */}
      <section className="px-6 grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
              <Flame size={20} fill="currentColor" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">STREAK</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{streak}일</p>
          <div className="mt-2 flex gap-1">
            {activityFlow.map((day, i) => (
              <div 
                key={i} 
                className={`h-1 flex-1 rounded-full ${day.active ? 'bg-orange-400' : 'bg-slate-100 dark:bg-slate-800'}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
              <Activity size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">STATUS</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight">
            {daysSinceLast === 0 ? '오늘 완료' : `${daysSinceLast}일째 휴식`}
          </p>
        </div>
      </section>

      {/* 1. Weekly Volume Trend (Line Chart) */}
      <section className="px-6">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" /> 주간 볼륨 추이
            </h3>
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">
              {weekly.totalVolume.toLocaleString()} kg
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="opacity-10" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#0ea5e9" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVolume)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Monthly Report Card (Minimalist Apple Card style) */}
      <section className="px-6">
        <div className="bg-gradient-to-br from-slate-900 to-black dark:from-slate-800 dark:to-slate-950 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <Calendar size={20} className="text-primary-400" />
              <h3 className="text-lg font-bold tracking-tight">이달의 리포트</h3>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">월간 볼륨</p>
                <p className="text-2xl font-black">{monthly.totalVolume.toLocaleString()} <span className="text-sm font-medium text-white/50">kg</span></p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">운동 횟수</p>
                <p className="text-2xl font-black">{monthly.count} <span className="text-sm font-medium text-white/50">일</span></p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/60">당신의 노력이</p>
                <p className="text-sm font-black text-primary-400">결과로 증명됩니다.</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Trophy size={24} className="text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Body Part Ratio (Pie Chart) */}
      <section className="px-6 grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <PieIcon size={18} className="text-rose-500" /> 부위별 운동 비중
          </h3>
          <div className="h-48 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bodyPartStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={8}
                    dataKey="count"
                  >
                    {bodyPartStats.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 flex flex-col gap-2 pl-4">
              {bodyPartStats.slice(0, 4).map((stat, idx) => (
                <div key={stat.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{stat.name}</span>
                  <span className="text-[11px] text-slate-400 ml-auto">{stat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. PR Records */}
      <section className="px-6 mb-12">
        <div className="bg-slate-900 dark:bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden border border-slate-800">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-400" /> 개인 최고 기록 (PR)
          </h3>
          <div className="space-y-4">
            {prs.length > 0 ? prs.map((pr, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-bold text-white">{pr.exercise}</p>
                  <p className="text-[10px] text-white/40">{new Date(pr.date).toLocaleDateString()}</p>
                </div>
                <p className="text-xl font-black text-white">{pr.weight} <span className="text-[10px] font-bold text-white/50 uppercase">kg</span></p>
              </div>
            )) : (
              <p className="text-sm text-white/30 text-center py-4">아직 PR 기록이 없습니다.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardScreen;
