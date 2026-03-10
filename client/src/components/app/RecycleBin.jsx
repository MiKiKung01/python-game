import { useState } from 'react';
import { File, Folder, Trash2, RefreshCcw, X, FileText, FileCode, Image, AlertTriangle, CheckCircle } from 'lucide-react';

const FILE_ICONS = {
  folder: { icon: Folder, color: 'text-yellow-500' },
  file: { icon: FileText, color: 'text-blue-400' },
  py: { icon: FileCode, color: 'text-green-500' },
  js: { icon: FileCode, color: 'text-yellow-400' },
  txt: { icon: FileText, color: 'text-gray-400' },
  html: { icon: FileCode, color: 'text-orange-400' },
  png: { icon: Image, color: 'text-pink-400' },
};

function getFileIcon(item) {
  if (item.type === 'folder') return FILE_ICONS.folder;
  const ext = item.name.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.file;
}

export default function RecycleBin({ items = [], onRestore, onDeletePermanent, onEmptyBin }) {
  const [selectedId, setSelectedId] = useState(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleRestore = (item) => {
    onRestore?.(item.id);
    setSelectedId(null);
    showToast(`"${item.name}" restored`);
  };

  const handleDeletePermanent = (item) => {
    if (confirm(`Permanently delete "${item.name}"? This cannot be undone.`)) {
      onDeletePermanent?.(item.id);
      setSelectedId(null);
    }
  };

  const handleEmptyBin = () => {
    if (confirmEmpty) {
      onEmptyBin?.();
      setConfirmEmpty(false);
      showToast('Recycle Bin emptied');
    } else {
      setConfirmEmpty(true);
      setTimeout(() => setConfirmEmpty(false), 3000);
    }
  };

  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <div className="h-full bg-white flex flex-col text-slate-800 font-sans select-none" onClick={() => setSelectedId(null)}>
      
      {/* Toolbar */}
      <div className="bg-slate-50 p-2 border-b border-slate-200 flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); handleEmptyBin(); }}
          disabled={items.length === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold transition-all
            ${items.length === 0 
              ? 'text-slate-300 cursor-not-allowed' 
              : confirmEmpty 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-red-600'}`}
        >
          <Trash2 size={14} /> 
          {confirmEmpty ? 'Click again to confirm' : 'Empty Recycle Bin'}
        </button>

        {selectedItem && (
          <>
            <div className="h-5 w-px bg-slate-300" />
            <button 
              onClick={(e) => { e.stopPropagation(); handleRestore(selectedItem); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-green-50 hover:border-green-200 text-green-600 text-sm font-semibold transition-all"
            >
              <RefreshCcw size={14} /> Restore
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeletePermanent(selectedItem); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded hover:bg-red-50 hover:border-red-200 text-red-500 text-sm font-semibold transition-all"
            >
              <X size={14} /> Delete
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-16">
            <Trash2 size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-400">Recycle Bin is empty</p>
            <p className="text-xs text-slate-300 mt-1">Deleted files will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {items.map(item => {
              const iconInfo = getFileIcon(item);
              const IconComp = iconInfo.icon;
              const isSelected = selectedId === item.id;
              const deletedDate = item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : 'Unknown';
              return (
                <div 
                  key={item.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(isSelected ? null : item.id); }}
                  className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all group relative
                    ${isSelected 
                      ? 'bg-blue-100 border border-blue-300 shadow-sm' 
                      : 'border border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                >
                  <div className="relative">
                    <IconComp size={36} className={`${iconInfo.color} opacity-60 mb-1.5`} />
                    <Trash2 size={12} className="absolute -bottom-0.5 -right-1 text-red-400" />
                  </div>
                  <span className={`text-xs text-center leading-tight w-full truncate
                    ${isSelected ? 'font-bold text-blue-700' : 'text-slate-600'}`}>
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{deletedDate}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-1.5 flex justify-between text-[11px] text-slate-400">
        <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
        {selectedItem && <span>Selected: {selectedItem.name} | Deleted: {selectedItem.deletedAt ? new Date(selectedItem.deletedAt).toLocaleString() : '—'}</span>}
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-fade-in z-50">
          <CheckCircle size={16} className="text-green-400" /> {toast}
        </div>
      )}
    </div>
  );
}