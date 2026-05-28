import React, { useState, useRef } from 'react';
import { X, Download, Upload, AlertTriangle, Database } from 'lucide-react';
import { exportData, importData, clearAllData } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearText, setClearText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const success = await importData(file);
    setImporting(false);
    
    if (success) {
      alert('데이터 복원이 완료되었습니다. 앱을 재시작합니다.');
      window.location.reload();
    } else {
      alert('데이터 복원에 실패했습니다. 잘못된 파일 형식입니다.');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    if (clearText === '초기화') {
      clearAllData();
      alert('모든 데이터가 초기화되었습니다.');
      window.location.reload();
    } else {
      alert('"초기화"라고 정확히 입력해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm shadow-2xl animate-slide-up border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 rounded-t-[32px] z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Database size={20} className="text-primary-500" />
            데이터 관리
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          {/* Backup Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">백업 및 복구</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              운동 기록, 목표, 체성분 기록 등 모든 데이터를 하나의 JSON 파일로 안전하게 보관하세요.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold rounded-2xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
              >
                <Download size={18} /> JSON 백업 (내보내기)
              </button>
              
              <button 
                onClick={handleImportClick}
                disabled={importing}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                <Upload size={18} /> {importing ? '복원 중...' : 'JSON 복원 (가져오기)'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Danger Zone */}
          <div>
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1">
              <AlertTriangle size={16} /> 위험 구역
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              이 작업은 되돌릴 수 없습니다. 삭제 전 반드시 백업을 권장합니다.
            </p>

            {!showClearConfirm ? (
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="w-full py-3.5 bg-white dark:bg-slate-900 text-rose-500 font-bold rounded-2xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                전체 데이터 초기화
              </button>
            ) : (
              <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 animate-fade-in flex flex-col gap-3">
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  정말 삭제하시겠습니까? 삭제하려면 아래에 <span className="bg-white dark:bg-slate-800 px-1 rounded">초기화</span> 라고 입력하세요.
                </p>
                <input 
                  type="text" 
                  value={clearText}
                  onChange={(e) => setClearText(e.target.value)}
                  placeholder="초기화"
                  className="w-full px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-rose-500 outline-none text-sm font-bold text-center bg-white dark:bg-slate-800 dark:text-slate-100"
                />
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => { setShowClearConfirm(false); setClearText(''); }}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-500 font-bold rounded-xl text-sm"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleClearData}
                    className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-500/20"
                  >
                    삭제 실행
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
