import { useState } from 'react';
import { 
  HardDrive, Folder, File, ChevronRight, 
  FolderPlus, FilePlus, Trash2, ArrowLeft, Home,
  Monitor, FileText, FileCode, Image, ChevronDown
} from 'lucide-react';

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

// Special view modes
const VIEW = {
  ROOT: 'ROOT',           // Shows Desktop + C: drive
  DESKTOP: 'DESKTOP',     // Shows files with parentId === null (Desktop = root files)
  DRIVE_C: 'DRIVE_C',     // Shows C: contents (all non-root folders)
  FOLDER: 'FOLDER',       // Inside a specific folder
};

export default function MyComputer({ files = [], onCreateFile, onDeleteFile, onOpenFile, initialFolderId }) {
  const [view, setView] = useState(initialFolderId ? VIEW.FOLDER : VIEW.ROOT);
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId || null);
  const [contextMenu, setContextMenu] = useState(null);
  const [isCreating, setIsCreating] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Navigation
  const navigateToFolder = (folderId) => {
    setCurrentFolderId(folderId);
    setView(VIEW.FOLDER);
    setSelectedItem(null);
  };

  const navigateToDesktop = () => {
    setView(VIEW.DESKTOP);
    setCurrentFolderId(null);
    setSelectedItem(null);
  };

  const navigateToRoot = () => {
    setView(VIEW.ROOT);
    setCurrentFolderId(null);
    setSelectedItem(null);
  };

  const navigateToDriveC = () => {
    setView(VIEW.DRIVE_C);
    setCurrentFolderId(null);
    setSelectedItem(null);
  };

  const goBack = () => {
    if (view === VIEW.FOLDER && currentFolderId) {
      const current = files.find(f => f.id === currentFolderId);
      if (current?.parentId) {
        navigateToFolder(current.parentId);
      } else {
        // Parent is root — could be Desktop or C:'s root
        // Check if current folder has parentId null (it's in Desktop)
        navigateToDriveC();
      }
    } else if (view === VIEW.DESKTOP || view === VIEW.DRIVE_C) {
      navigateToRoot();
    }
  };

  // Get current items
  const getCurrentItems = () => {
    if (view === VIEW.DESKTOP) {
      // Desktop = root-level files (parentId null or undefined)
      return files.filter(f => !f.parentId);
    }
    if (view === VIEW.DRIVE_C) {
      // C: shows root-level folders (work folders)
      return files.filter(f => !f.parentId && f.type === 'folder');
    }
    if (view === VIEW.FOLDER) {
      return files.filter(f => f.parentId === currentFolderId);
    }
    return [];
  };

  const currentItems = getCurrentItems();
  const folders = currentItems.filter(f => f.type === 'folder').sort((a, b) => a.name.localeCompare(b.name));
  const fileItems = currentItems.filter(f => f.type === 'file').sort((a, b) => a.name.localeCompare(b.name));
  const sortedItems = [...folders, ...fileItems];

  // Breadcrumb
  const getBreadcrumb = () => {
    if (view === VIEW.ROOT) return [{ label: 'This PC', action: navigateToRoot }];
    if (view === VIEW.DESKTOP) return [
      { label: 'This PC', action: navigateToRoot },
      { label: 'Desktop', action: navigateToDesktop }
    ];
    if (view === VIEW.DRIVE_C) return [
      { label: 'This PC', action: navigateToRoot },
      { label: 'Local Disk (C:)', action: navigateToDriveC }
    ];
    // FOLDER view — build trail
    const trail = [
      { label: 'This PC', action: navigateToRoot },
      { label: 'Local Disk (C:)', action: navigateToDriveC }
    ];
    const buildPath = (fId) => {
      const f = files.find(x => x.id === fId);
      if (!f) return;
      if (f.parentId) buildPath(f.parentId);
      trail.push({ label: f.name, action: () => navigateToFolder(f.id) });
    };
    if (currentFolderId) buildPath(currentFolderId);
    return trail;
  };

  const breadcrumb = getBreadcrumb();

  // Get parentId for creating files in current location
  const getCreateParentId = () => {
    if (view === VIEW.DESKTOP) return null; // Desktop = root
    if (view === VIEW.FOLDER) return currentFolderId;
    return null;
  };

  const handleCreate = () => {
    const name = newItemName.trim();
    if (!name || !isCreating) return;
    onCreateFile?.({
      id: Date.now(),
      name,
      type: isCreating,
      parentId: getCreateParentId(),
      content: isCreating === 'file' ? '' : undefined,
      createdAt: new Date().toISOString(),
      // If creating on Desktop, add position
      ...(view === VIEW.DESKTOP ? { pos: { x: 120 + Math.random() * 300, y: 50 + Math.random() * 200 } } : {})
    });
    setIsCreating(null);
    setNewItemName('');
  };

  const handleDelete = (item) => {
    onDeleteFile?.(item.id);
    setContextMenu(null);
    setSelectedItem(null);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item.id === selectedItem ? null : item.id);
  };

  const handleItemDoubleClick = (item) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id);
    } else {
      // Open file
      onOpenFile?.(item);
    }
  };

  const handleItemContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleBgContextMenu = (e) => {
    e.preventDefault();
    if (view === VIEW.ROOT) return; // No create at root
    setContextMenu({ x: e.clientX, y: e.clientY, item: null });
  };

  const canCreate = view === VIEW.DESKTOP || view === VIEW.FOLDER;

  return (
    <div className="h-full bg-white flex flex-col text-slate-800 font-sans select-none"
         onClick={() => { setContextMenu(null); setSelectedItem(null); }}>
      
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); goBack(); }}
          disabled={view === VIEW.ROOT}
          className={`p-1.5 rounded transition-colors ${view !== VIEW.ROOT ? 'hover:bg-slate-200 text-slate-600' : 'text-slate-300 cursor-not-allowed'}`}
        >
          <ArrowLeft size={18} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); navigateToRoot(); }}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <Home size={18} />
        </button>
        
        {canCreate && (
          <>
            <div className="h-5 w-px bg-slate-300 mx-1" />
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCreating('folder'); setNewItemName('New Folder'); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
              <FolderPlus size={15} /> New Folder
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsCreating('file'); setNewItemName('new_file.txt'); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
              <FilePlus size={15} /> New File
            </button>
          </>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-1 text-sm">
        <Monitor size={14} className="text-slate-400 mr-1" />
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center">
            {i > 0 && <ChevronRight size={12} className="text-slate-300 mx-0.5" />}
            <button 
              onClick={(e) => { e.stopPropagation(); crumb.action(); }}
              className={`px-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors
                ${i === breadcrumb.length - 1 ? 'font-bold text-slate-800' : 'text-slate-500'}`}
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4" onContextMenu={handleBgContextMenu}>
        
        {/* ROOT VIEW - This PC */}
        {view === VIEW.ROOT && (
          <>
            {/* Desktop shortcut */}
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Folders</h2>
            <div className="flex gap-3 mb-6">
              <button 
                onClick={navigateToDesktop}
                className="flex items-center gap-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg p-3 w-52 transition-colors text-left"
              >
                <Monitor size={28} className="text-blue-500" />
                <div>
                  <div className="font-bold text-sm text-slate-700">Desktop</div>
                  <div className="text-[10px] text-slate-400">{files.filter(f => !f.parentId).length} items</div>
                </div>
              </button>
            </div>

            {/* C: Drive */}
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Devices and drives</h2>
            <div className="flex gap-3">
              <button 
                onClick={navigateToDriveC}
                className="flex items-center gap-3 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg p-3 w-64 transition-colors text-left"
              >
                <HardDrive size={28} className="text-slate-500" />
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-700">Local Disk (C:)</div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '45%' }} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">234 GB free of 512 GB</div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* FILE LISTING (Desktop, Drive C, or Folder) */}
        {view !== VIEW.ROOT && (
          <>
            {/* Inline creation */}
            {isCreating && canCreate && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in"
                   onClick={(e) => e.stopPropagation()}>
                {isCreating === 'folder' ? <Folder size={20} className="text-yellow-500" /> : <FileText size={20} className="text-blue-400" />}
                <input
                  autoFocus
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setIsCreating(null); setNewItemName(''); }}}
                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
                <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-500">Create</button>
                <button onClick={() => { setIsCreating(null); setNewItemName(''); }} className="px-2 py-1 text-slate-400 text-xs hover:text-red-500">Cancel</button>
              </div>
            )}

            {sortedItems.length === 0 && !isCreating ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-16">
                <Folder size={56} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">This folder is empty</p>
                {canCreate && <p className="text-xs text-slate-300 mt-1">Right-click or use toolbar to create files</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1">
                {sortedItems.map(item => {
                  const iconInfo = getFileIcon(item);
                  const IconComp = iconInfo.icon;
                  const isSelected = selectedItem === item.id;
                  return (
                    <div 
                      key={item.id}
                      onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                      onDoubleClick={() => handleItemDoubleClick(item)}
                      onContextMenu={(e) => handleItemContextMenu(e, item)}
                      className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all group
                        ${isSelected ? 'bg-blue-100 border border-blue-300 shadow-sm' : 'border border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                    >
                      <IconComp size={36} className={`${iconInfo.color} mb-1.5 ${item.type === 'folder' ? 'group-hover:scale-105 transition-transform' : ''}`} />
                      <span className={`text-xs text-center leading-tight w-full truncate
                        ${isSelected ? 'font-bold text-blue-700' : 'text-slate-700'}`}>
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-1.5 flex justify-between text-[11px] text-slate-400">
        <span>{view === VIEW.ROOT ? '2 items' : `${sortedItems.length} item${sortedItems.length !== 1 ? 's' : ''}`}</span>
        {selectedItem && <span>{files.find(f => f.id === selectedItem)?.name}</span>}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-slate-800 border border-slate-600 rounded-lg shadow-2xl py-1 w-44 z-[100] text-white text-sm overflow-hidden animate-fade-in"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item ? (
            <>
              <button 
                onClick={() => handleDelete(contextMenu.item)}
                className="w-full text-left px-4 py-2 hover:bg-red-600 flex items-center gap-2 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
              {contextMenu.item.type === 'folder' && (
                <button 
                  onClick={() => { navigateToFolder(contextMenu.item.id); setContextMenu(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-600 flex items-center gap-2 transition-colors"
                >
                  <Folder size={14} className="text-yellow-400" /> Open
                </button>
              )}
              {contextMenu.item.type === 'file' && (
                <button 
                  onClick={() => { onOpenFile?.(contextMenu.item); setContextMenu(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-blue-600 flex items-center gap-2 transition-colors"
                >
                  <FileText size={14} /> Open
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                onClick={() => { setIsCreating('folder'); setNewItemName('New Folder'); setContextMenu(null); }}
                className="w-full text-left px-4 py-2 hover:bg-blue-600 flex items-center gap-2 transition-colors"
              >
                <FolderPlus size={14} className="text-yellow-400" /> New Folder
              </button>
              <button 
                onClick={() => { setIsCreating('file'); setNewItemName('new_file.txt'); setContextMenu(null); }}
                className="w-full text-left px-4 py-2 hover:bg-blue-600 flex items-center gap-2 transition-colors"
              >
                <FilePlus size={14} /> New File
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}