import { useState, useRef, useEffect } from 'react';
import {
    Play, FileCode, Folder, Trash2, X, Terminal,
    FilePlus, FolderPlus, Save, ChevronRight, ChevronDown,
    FileText
} from 'lucide-react';

export default function CodeEditor({ files = [], folderId, onCreateFile, onDeleteFile, onUpdateFile }) {
    // If no folderId, show folder picker
    const [selectedFolderId, setSelectedFolderId] = useState(folderId || null);
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [terminalLogs, setTerminalLogs] = useState([
        "Python 3.9.5 (default)",
        "Type \"help\" for more information.",
        ">>>"
    ]);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const terminalEndRef = useRef(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [terminalLogs]);

    // Get files in selected folder
    const getFilesInFolder = (parentId) => {
        return files.filter(f => (f.parentId || null) === parentId);
    };

    // All folders for picker
    const allFolders = files.filter(f => f.type === 'folder');

    // Files visible in explorer (recursive tree)
    const currentFile = files.find(f => f.id === activeTabId);

    // --- Functions ---
    const handleOpenFile = (file) => {
        if (file.type === 'folder') {
            setExpandedFolders(prev => {
                const next = new Set(prev);
                next.has(file.id) ? next.delete(file.id) : next.add(file.id);
                return next;
            });
            return;
        }
        if (!openTabs.includes(file.id)) {
            setOpenTabs([...openTabs, file.id]);
        }
        setActiveTabId(file.id);
    };

    const handleCloseTab = (e, fileId) => {
        e.stopPropagation();
        const newTabs = openTabs.filter(id => id !== fileId);
        setOpenTabs(newTabs);
        if (activeTabId === fileId) {
            setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
        }
    };

    const handleUpdateContent = (newContent) => {
        onUpdateFile?.(activeTabId, newContent);
    };

    const handleRunCode = () => {
        if (!currentFile) return;

        const newLog = `>>> python ${currentFile.name}`;
        let output = "";

        const content = currentFile.content || '';
        if (content.includes("print")) {
            const match = content.match(/print\s*\(\s*["'](.+?)["']\s*\)/);
            output = match ? match[1] : "Done.";
        } else {
            output = "Process finished with exit code 0";
        }

        setTerminalLogs([...terminalLogs, newLog, output]);
    };

    const handleCreateFile = (type) => {
        const name = prompt(type === 'folder' ? 'Folder name:' : 'File name (e.g. script.py):');
        if (!name) return;
        const newFile = {
            id: Date.now(),
            name,
            type,
            parentId: selectedFolderId,
            content: type === 'file' ? '' : undefined,
            createdAt: new Date().toISOString()
        };
        onCreateFile?.(newFile);
        if (type === 'file') {
            setTimeout(() => {
                setOpenTabs(prev => [...prev, newFile.id]);
                setActiveTabId(newFile.id);
            }, 50);
        }
    };

    const handleDeleteFile = (id) => {
        if (window.confirm("Delete this file?")) {
            onDeleteFile?.(id);
            setOpenTabs(prev => prev.filter(t => t !== id));
            if (activeTabId === id) setActiveTabId(null);
        }
    };

    // Ctrl+S
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Folder picker view
    if (!selectedFolderId) {
        return (
            <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-300">
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-md w-full">
                        <div className="text-center mb-8">
                            <FileCode size={48} className="mx-auto mb-4 text-blue-400 opacity-60" />
                            <h2 className="text-xl font-bold text-white mb-2">Open Folder</h2>
                            <p className="text-sm text-gray-500">Select a folder to start working</p>
                        </div>

                        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                            {allFolders.length === 0 ? (
                                <div className="text-center py-8 text-gray-600">
                                    <p className="text-sm">No folders found.</p>
                                    <p className="text-xs mt-1">Create a folder in My Computer first.</p>
                                </div>
                            ) : (
                                allFolders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-[#2d2d2d] hover:bg-[#37373d] rounded-lg transition-colors text-left group"
                                    >
                                        <Folder size={20} className="text-yellow-500" fill="currentColor" />
                                        <div>
                                            <div className="font-medium text-sm text-gray-200">{folder.name}</div>
                                            <div className="text-xs text-gray-600">
                                                {files.filter(f => f.parentId === folder.id).length} items
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="ml-auto text-gray-600 group-hover:text-gray-400" />
                                    </button>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => {
                                const name = prompt('Create new project folder:', 'my-project');
                                if (!name) return;
                                const newFolder = {
                                    id: Date.now(),
                                    name,
                                    type: 'folder',
                                    parentId: null,
                                    createdAt: new Date().toISOString()
                                };
                                onCreateFile?.(newFolder);
                                setTimeout(() => setSelectedFolderId(newFolder.id), 50);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors"
                        >
                            <FolderPlus size={16} /> Create New Project
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Recursive file tree renderer
    const FileTree = ({ parentId, depth = 0 }) => {
        const items = getFilesInFolder(parentId);
        const folders = items.filter(i => i.type === 'folder');
        const fileItems = items.filter(i => i.type === 'file');
        const sorted = [...folders, ...fileItems];

        return sorted.map(item => (
            <div key={item.id}>
                <div
                    onClick={() => handleOpenFile(item)}
                    className={`flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-[#2a2d2e] group ${activeTabId === item.id ? 'bg-[#37373d] text-white' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                >
                    <div className="flex items-center gap-1.5 min-w-0">
                        {item.type === 'folder' ? (
                            <>
                                {expandedFolders.has(item.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                <Folder size={14} className="text-yellow-500 shrink-0" fill="currentColor" />
                            </>
                        ) : (
                            <>
                                <span className="w-3" />
                                <FileCode size={14} className={`shrink-0 ${item.name.endsWith('.py') ? 'text-yellow-400' : item.name.endsWith('.txt') ? 'text-gray-400' : 'text-blue-400'}`} />
                            </>
                        )}
                        <span className="truncate text-xs">{item.name}</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(item.id); }}
                        className="hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0"
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
                {item.type === 'folder' && expandedFolders.has(item.id) && (
                    <FileTree parentId={item.id} depth={depth + 1} />
                )}
            </div>
        ));
    };

    const selectedFolder = files.find(f => f.id === selectedFolderId);

    return (
        <div className="flex h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm">

            {/* --- LEFT SIDEBAR (EXPLORER) --- */}
            <div className="w-56 flex flex-col border-r border-[#333] bg-[#252526]">
                <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 pl-3 flex justify-between items-center">
                    <span className="truncate">{selectedFolder?.name || 'Explorer'}</span>
                    <div className="flex gap-1">
                        <button onClick={() => handleCreateFile('file')} title="New File" className="hover:text-white p-0.5"><FilePlus size={13} /></button>
                        <button onClick={() => handleCreateFile('folder')} title="New Folder" className="hover:text-white p-0.5"><FolderPlus size={13} /></button>
                        <button onClick={() => setSelectedFolderId(null)} title="Change Folder" className="hover:text-white p-0.5"><Folder size={13} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <FileTree parentId={selectedFolderId} />
                </div>
            </div>

            {/* --- MAIN AREA --- */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* TAB BAR */}
                <div className="flex bg-[#252526] overflow-x-auto border-b border-[#1e1e1e]">
                    {openTabs.map(tabId => {
                        const file = files.find(f => f.id === tabId);
                        if (!file) return null;
                        return (
                            <div
                                key={tabId}
                                onClick={() => setActiveTabId(tabId)}
                                className={`flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] border-r border-[#1e1e1e] cursor-pointer text-xs select-none
                                    ${activeTabId === tabId ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'bg-[#2d2d2d] hover:bg-[#2a2d2e]'}`}
                            >
                                <FileCode size={12} className={file.name.endsWith('.py') ? 'text-yellow-400' : 'text-gray-400'} />
                                <span className="truncate">{file.name}</span>
                                <X
                                    size={12}
                                    className="ml-auto hover:bg-gray-600 rounded p-0.5 shrink-0"
                                    onClick={(e) => handleCloseTab(e, tabId)}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* TOOLBAR */}
                <div className="flex justify-between items-center p-2 bg-[#1e1e1e] border-b border-[#333]">
                    <div className="text-[10px] text-gray-600 px-2">
                        {currentFile ? `${selectedFolder?.name}/${currentFile.name}` : ''}
                    </div>
                    <button
                        onClick={handleRunCode}
                        disabled={!currentFile || !currentFile.name.endsWith('.py')}
                        className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-colors
                            ${currentFile?.name.endsWith('.py') ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                    >
                        <Play size={14} fill="currentColor" /> Run
                    </button>
                </div>

                {/* EDITOR AREA */}
                <div className="flex-1 relative overflow-hidden">
                    {currentFile ? (
                        <div className="h-full flex">
                            {/* Line numbers */}
                            <div className="bg-[#1e1e1e] border-r border-[#333] px-2 py-4 text-right text-[11px] text-gray-600 font-mono select-none overflow-hidden leading-6 w-10">
                                {(currentFile.content || '').split('\n').map((_, i) => (
                                    <div key={i}>{i + 1}</div>
                                ))}
                            </div>
                            <textarea
                                className="flex-1 bg-[#1e1e1e] text-gray-200 p-4 outline-none resize-none font-mono text-sm leading-6"
                                value={currentFile.content || ''}
                                onChange={(e) => handleUpdateContent(e.target.value)}
                                spellCheck={false}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600">
                            <FileCode size={48} className="mb-4 opacity-20" />
                            <p className="text-sm">Select a file to start editing</p>
                            <p className="text-xs mt-2 text-gray-700">Or create a new file with the + button</p>
                        </div>
                    )}
                </div>

                {/* TERMINAL AREA */}
                <div className="h-36 border-t border-[#333] bg-[#1e1e1e] flex flex-col">
                    <div className="flex items-center gap-4 px-4 py-1 border-b border-[#333] text-xs font-bold uppercase">
                        <span className="border-b border-white pb-1 flex items-center gap-1"><Terminal size={11} /> Terminal</span>
                    </div>
                    <div className="flex-1 p-2 overflow-y-auto font-mono text-xs text-gray-300 space-y-0.5">
                        {terminalLogs.map((log, i) => (
                            <div key={i} className={log.startsWith('>>>') ? 'text-yellow-400 font-bold' : log.startsWith('Error') ? 'text-red-400' : ''}>
                                {log}
                            </div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                </div>
            </div>

            {/* --- RIGHT ACTIVITY BAR --- */}
            <div className="w-10 bg-[#333] flex flex-col items-center py-3 gap-3 border-l border-[#252526]">
                <FileCode size={16} className="text-gray-500 hover:text-white cursor-pointer" title="Explorer" />
                <Terminal size={16} className="text-gray-500 hover:text-white cursor-pointer" title="Terminal" />
            </div>
        </div>
    );
}