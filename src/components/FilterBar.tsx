import React, { useState } from 'react';
import { FilterState, SortOption } from '../utils/filters';
import { BODY_PARTS } from '../types/workout';
import { Search, SlidersHorizontal, X, Trophy } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (updates: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFilterChange({
      period: 'all',
      bodyPart: '전체',
      search: '',
      isPR: false,
      minVolume: 0,
      sortBy: 'latest'
    });
  };

  const hasActiveFilters = filters.period !== 'all' || filters.bodyPart !== '전체' || filters.isPR || filters.minVolume > 0 || filters.search;

  return (
    <div className="flex flex-col gap-3 px-4 mb-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="운동 검색..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
            value={filters.search}
            onChange={(e) => updateFilter({ search: e.target.value })}
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-2xl border transition-all ${isExpanded || hasActiveFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-slate-100 text-slate-400'}`}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {isExpanded && (
        <div className="glass-card rounded-[24px] p-4 flex flex-col gap-4 animate-slide-up border-slate-100">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-700 text-sm">상세 필터</h4>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
                <X size={12} /> 초기화
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Period */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">기간</p>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {['all', 'today', 'week', 'month', 'year'].map((p) => (
                  <button
                    key={p}
                    onClick={() => updateFilter({ period: p as any })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      filters.period === p ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {p === 'all' ? '전체' : p === 'today' ? '오늘' : p === 'week' ? '7일' : p === 'month' ? '한달' : '올해'}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Part */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">부위</p>
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {['전체', ...BODY_PARTS].map((part) => (
                  <button
                    key={part}
                    onClick={() => updateFilter({ bodyPart: part as any })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      filters.bodyPart === part ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Min Volume */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">최소 볼륨</p>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl outline-none text-xs font-bold border border-transparent focus:border-primary-300"
                  value={filters.minVolume || ''}
                  onChange={(e) => updateFilter({ minVolume: Number(e.target.value) })}
                />
              </div>
              {/* Sort By */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">정렬</p>
                <select
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl outline-none text-xs font-bold border border-transparent focus:border-primary-300"
                  value={filters.sortBy}
                  onChange={(e) => updateFilter({ sortBy: e.target.value as SortOption })}
                >
                  <option value="latest">최신순</option>
                  <option value="oldest">오래된순</option>
                  <option value="volume_desc">볼륨 높은순</option>
                  <option value="weight_desc">무게 높은순</option>
                  <option value="name_asc">운동명순</option>
                </select>
              </div>
            </div>

            {/* PR Toggle */}
            <button
              onClick={() => updateFilter({ isPR: !filters.isPR })}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                filters.isPR ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-transparent text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy size={16} className={filters.isPR ? 'text-amber-500' : 'text-slate-300'} />
                <span className="text-xs font-bold">PR(개인 최고 기록)만 보기</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-all ${filters.isPR ? 'bg-amber-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${filters.isPR ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
