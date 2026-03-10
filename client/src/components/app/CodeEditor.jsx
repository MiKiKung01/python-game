import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play, FileCode, Folder, Trash2, X, Terminal,
    FilePlus, FolderPlus, Save, ChevronRight, ChevronDown,
    FileText, Loader, Square, Eraser
} from 'lucide-react';
import usePyodide from '../../hooks/usePyodide';

// ==========================================
// Python Syntax Highlighter
// ==========================================
const PYTHON_KEYWORDS = new Set([
    'False','None','True','and','as','assert','async','await','break',
    'class','continue','def','del','elif','else','except','finally',
    'for','from','global','if','import','in','is','lambda','nonlocal',
    'not','or','pass','raise','return','try','while','with','yield'
]);

const PYTHON_BUILTINS = new Set([
    'print','len','range','int','str','float','list','dict','set','tuple',
    'type','isinstance','open','input','map','filter','zip','enumerate',
    'sorted','reversed','abs','max','min','sum','any','all','round',
    'bool','bytes','format','hasattr','getattr','setattr','id','hex','oct',
    'bin','chr','ord','repr','super','property','staticmethod','classmethod'
]);

function highlightPython(code) {
    if (!code) return [];

    const lines = code.split('\n');
    return lines.map(line => {
        const tokens = [];
        let i = 0;

        while (i < line.length) {
            // Comments
            if (line[i] === '#') {
                tokens.push({ type: 'comment', text: line.slice(i) });
                break;
            }

            // Triple-quoted strings (simplified — single line)
            if (line.slice(i, i + 3) === '"""' || line.slice(i, i + 3) === "'''") {
                const quote = line.slice(i, i + 3);
                const end = line.indexOf(quote, i + 3);
                if (end !== -1) {
                    tokens.push({ type: 'string', text: line.slice(i, end + 3) });
                    i = end + 3;
                } else {
                    tokens.push({ type: 'string', text: line.slice(i) });
                    break;
                }
                continue;
            }

            // Strings
            if (line[i] === '"' || line[i] === "'") {
                const quote = line[i];
                let j = i + 1;
                while (j < line.length && line[j] !== quote) {
                    if (line[j] === '\\') j++;
                    j++;
                }
                tokens.push({ type: 'string', text: line.slice(i, j + 1) });
                i = j + 1;
                continue;
            }

            // Numbers
            if (/\d/.test(line[i])) {
                let j = i;
                while (j < line.length && /[\d.xXoObBeE_]/.test(line[j])) j++;
                tokens.push({ type: 'number', text: line.slice(i, j) });
                i = j;
                continue;
            }

            // Words (keywords, builtins, identifiers)
            if (/[a-zA-Z_]/.test(line[i])) {
                let j = i;
                while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
                const word = line.slice(i, j);
                if (PYTHON_KEYWORDS.has(word)) {
                    tokens.push({ type: 'keyword', text: word });
                } else if (PYTHON_BUILTINS.has(word)) {
                    tokens.push({ type: 'builtin', text: word });
                } else {
                    tokens.push({ type: 'text', text: word });
                }
                i = j;
                continue;
            }

            // Decorators
            if (line[i] === '@') {
                let j = i + 1;
                while (j < line.length && /[a-zA-Z0-9_.]/.test(line[j])) j++;
                tokens.push({ type: 'decorator', text: line.slice(i, j) });
                i = j;
                continue;
            }

            // Operators and punctuation
            if ('()[]{}:,.+-*/%=<>!&|^~'.includes(line[i])) {
                tokens.push({ type: 'operator', text: line[i] });
                i++;
                continue;
            }

            // Whitespace and other
            tokens.push({ type: 'text', text: line[i] });
            i++;
        }

        return tokens;
    });
}

const TOKEN_COLORS = {
    keyword: '#c678dd',
    builtin: '#61afef',
    string: '#98c379',
    number: '#d19a66',
    comment: '#5c6370',
    decorator: '#e5c07b',
    operator: '#56b6c2',
    text: '#abb2bf',
};

// ==========================================
// Main CodeEditor Component
// ==========================================
export default function CodeEditor({ files = [], folderId, onCreateFile, onDeleteFile, onUpdateFile }) {
    const [selectedFolderId, setSelectedFolderId] = useState(folderId || null);
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [terminalOutput, setTerminalOutput] = useState([
        { type: 'system', text: 'Python Terminal — Loading...' }
    ]);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [showTerminal, setShowTerminal] = useState(true);

    const textareaRef = useRef(null);
    const highlightRef = useRef(null);
    const terminalEndRef = useRef(null);
    const lineNumbersRef = useRef(null);

    // Pyodide hook
    const { status: pyStatus, runCode, clearOutput, setOnOutput } = usePyodide();

    // Sync terminal output from Pyodide
    useEffect(() => {
        setOnOutput((output) => setTerminalOutput(output));
    }, [setOnOutput]);

    // Auto-scroll terminal
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);

    // Get files in selected folder
    const getFilesInFolder = (parentId) => files.filter(f => (f.parentId || null) === parentId);
    const allFolders = files.filter(f => f.type === 'folder');
    const currentFile = files.find(f => f.id === activeTabId);

    // --- File operations ---
    const handleOpenFile = (file) => {
        if (file.type === 'folder') {
            setExpandedFolders(prev => {
                const next = new Set(prev);
                next.has(file.id) ? next.delete(file.id) : next.add(file.id);
                return next;
            });
            return;
        }
        if (!openTabs.includes(file.id)) setOpenTabs([...openTabs, file.id]);
        setActiveTabId(file.id);
    };

    const handleCloseTab = (e, fileId) => {
        e.stopPropagation();
        const newTabs = openTabs.filter(id => id !== fileId);
        setOpenTabs(newTabs);
        if (activeTabId === fileId) setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    };

    const handleUpdateContent = (newContent) => {
        onUpdateFile?.(activeTabId, newContent);
    };

    const handleCreateFile = (type) => {
        const name = prompt(type === 'folder' ? 'Folder name:' : 'File name (e.g. script.py):');
        if (!name) return;
        const newFile = {
            id: Date.now(), name, type,
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

    // --- Run Python code ---
    const handleRunCode = useCallback(async () => {
        if (!currentFile || !currentFile.name.endsWith('.py')) return;
        if (pyStatus === 'running') return;

        // Get sibling files in the same folder for FS sync
        const siblingFiles = files
            .filter(f => (f.parentId || null) === (currentFile.parentId || null) && f.id !== currentFile.id)
            .map(f => ({ name: f.name, type: f.type, content: f.content || '' }));

        const result = await runCode(currentFile.content || '', siblingFiles);

        // Sync file changes back to game FS
        if (result?.fsChanges) {
            const { created, deleted } = result.fsChanges;
            if (created && created.length > 0) {
                for (const f of created) {
                    // Don't re-create files that already exist
                    const exists = files.find(
                        ef => ef.name === f.name && (ef.parentId || null) === (currentFile.parentId || null)
                    );
                    if (!exists) {
                        onCreateFile?.({
                            id: Date.now() + Math.random(),
                            name: f.name,
                            type: f.type,
                            parentId: currentFile.parentId || null,
                            content: f.content,
                            createdAt: new Date().toISOString()
                        });
                    } else if (f.type === 'file' && f.content !== exists.content) {
                        // Update existing file content if modified
                        onUpdateFile?.(exists.id, f.content);
                    }
                }
            }
            // Handle modified files
            if (result.fsChanges.modified) {
                for (const f of result.fsChanges.modified) {
                    const existing = files.find(
                        ef => ef.name === f.name && (ef.parentId || null) === (currentFile.parentId || null)
                    );
                    if (existing && f.type === 'file' && f.content !== existing.content) {
                        onUpdateFile?.(existing.id, f.content);
                    }
                }
            }
        }
    }, [currentFile, files, pyStatus, runCode, onCreateFile, onUpdateFile]);

    // --- Keyboard handling ---
    const handleKeyDown = (e) => {
        // Tab = 4 spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            const ta = e.target;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const val = ta.value;
            const newVal = val.substring(0, start) + '    ' + val.substring(end);
            handleUpdateContent(newVal);
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = start + 4;
            });
        }

        // Enter = auto-indent
        if (e.key === 'Enter') {
            e.preventDefault();
            const ta = e.target;
            const start = ta.selectionStart;
            const val = ta.value;
            const lineStart = val.lastIndexOf('\n', start - 1) + 1;
            const currentLine = val.substring(lineStart, start);
            const indentMatch = currentLine.match(/^(\s*)/);
            let indent = indentMatch ? indentMatch[1] : '';
            // Add extra indent after ':'
            if (currentLine.trimEnd().endsWith(':')) indent += '    ';
            const newVal = val.substring(0, start) + '\n' + indent + val.substring(ta.selectionEnd);
            handleUpdateContent(newVal);
            requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = start + 1 + indent.length;
            });
        }

        // Ctrl+Enter = Run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleRunCode();
        }
    };

    // Sync scroll between textarea and highlight overlay
    const handleScroll = () => {
        if (highlightRef.current && textareaRef.current) {
            highlightRef.current.scrollTop = textareaRef.current.scrollTop;
            highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Ctrl+S intercept
    useEffect(() => {
        const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') e.preventDefault(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // ==========================================
    // Folder Picker View
    // ==========================================
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
                                    <button key={folder.id} onClick={() => setSelectedFolderId(folder.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-[#2d2d2d] hover:bg-[#37373d] rounded-lg transition-colors text-left group">
                                        <Folder size={20} className="text-yellow-500" fill="currentColor" />
                                        <div>
                                            <div className="font-medium text-sm text-gray-200">{folder.name}</div>
                                            <div className="text-xs text-gray-600">{files.filter(f => f.parentId === folder.id).length} items</div>
                                        </div>
                                        <ChevronRight size={16} className="ml-auto text-gray-600 group-hover:text-gray-400" />
                                    </button>
                                ))
                            )}
                        </div>
                        <button onClick={() => {
                            const name = prompt('Create new project folder:', 'my-project');
                            if (!name) return;
                            const newFolder = { id: Date.now(), name, type: 'folder', parentId: null, createdAt: new Date().toISOString() };
                            onCreateFile?.(newFolder);
                            setTimeout(() => setSelectedFolderId(newFolder.id), 50);
                        }} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors">
                            <FolderPlus size={16} /> Create New Project
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // File Tree
    // ==========================================
    const FileTree = ({ parentId, depth = 0 }) => {
        const items = getFilesInFolder(parentId);
        const folders = items.filter(i => i.type === 'folder');
        const fileItems = items.filter(i => i.type === 'file');
        const sorted = [...folders, ...fileItems];

        return sorted.map(item => (
            <div key={item.id}>
                <div onClick={() => handleOpenFile(item)}
                    className={`flex items-center justify-between gap-2 px-2 py-1 cursor-pointer hover:bg-[#2a2d2e] group ${activeTabId === item.id ? 'bg-[#37373d] text-white' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 16}px` }}>
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
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(item.id); }}
                        className="hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0">
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
    const content = currentFile?.content || '';
    const highlighted = currentFile?.name.endsWith('.py') ? highlightPython(content) : null;
    const lineCount = content.split('\n').length;

    // ==========================================
    // Render
    // ==========================================
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

                {/* Pyodide Status */}
                <div className="p-2 border-t border-[#333] text-[10px]">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                            pyStatus === 'ready' ? 'bg-green-500' :
                            pyStatus === 'loading' ? 'bg-yellow-500 animate-pulse' :
                            pyStatus === 'running' ? 'bg-blue-500 animate-pulse' :
                            'bg-gray-600'
                        }`} />
                        <span className="text-gray-500">
                            {pyStatus === 'ready' ? 'Python Ready' :
                             pyStatus === 'loading' ? 'Loading Python...' :
                             pyStatus === 'running' ? 'Running...' :
                             'Python Idle'}
                        </span>
                    </div>
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
                            <div key={tabId} onClick={() => setActiveTabId(tabId)}
                                className={`flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px] border-r border-[#1e1e1e] cursor-pointer text-xs select-none
                                    ${activeTabId === tabId ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'bg-[#2d2d2d] hover:bg-[#2a2d2e]'}`}>
                                <FileCode size={12} className={file.name.endsWith('.py') ? 'text-yellow-400' : 'text-gray-400'} />
                                <span className="truncate">{file.name}</span>
                                <X size={12} className="ml-auto hover:bg-gray-600 rounded p-0.5 shrink-0"
                                    onClick={(e) => handleCloseTab(e, tabId)} />
                            </div>
                        );
                    })}
                </div>

                {/* TOOLBAR */}
                <div className="flex justify-between items-center p-2 bg-[#1e1e1e] border-b border-[#333]">
                    <div className="text-[10px] text-gray-600 px-2">
                        {currentFile ? `${selectedFolder?.name}/${currentFile.name}` : ''}
                        {currentFile?.name.endsWith('.py') && <span className="ml-2 text-yellow-600">Python</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleRunCode}
                            disabled={!currentFile?.name.endsWith('.py') || pyStatus === 'running' || pyStatus === 'loading'}
                            className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-colors
                                ${currentFile?.name.endsWith('.py') && pyStatus === 'ready'
                                    ? 'bg-green-700 hover:bg-green-600 text-white'
                                    : pyStatus === 'running'
                                        ? 'bg-blue-700 text-white cursor-wait'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                            {pyStatus === 'running' ? (
                                <><Loader size={14} className="animate-spin" /> Running...</>
                            ) : pyStatus === 'loading' ? (
                                <><Loader size={14} className="animate-spin" /> Loading...</>
                            ) : (
                                <><Play size={14} fill="currentColor" /> Run</>
                            )}
                        </button>
                    </div>
                </div>

                {/* EDITOR AREA */}
                <div className="flex-1 relative overflow-hidden">
                    {currentFile ? (
                        <div className="h-full flex">
                            {/* Line numbers */}
                            <div ref={lineNumbersRef}
                                className="bg-[#1e1e1e] border-r border-[#333] px-2 py-4 text-right text-[11px] text-gray-600 font-mono select-none overflow-hidden leading-[22px] w-10"
                                style={{ overflowY: 'hidden' }}>
                                {Array.from({ length: lineCount }, (_, i) => (
                                    <div key={i}>{i + 1}</div>
                                ))}
                            </div>

                            {/* Editor container */}
                            <div className="flex-1 relative overflow-hidden">
                                {/* Syntax highlight overlay (behind textarea) */}
                                {highlighted && (
                                    <pre ref={highlightRef}
                                        className="absolute inset-0 p-4 font-mono text-sm leading-[22px] whitespace-pre-wrap break-words overflow-hidden pointer-events-none"
                                        style={{ color: '#abb2bf' }}
                                        aria-hidden="true">
                                        {highlighted.map((lineTokens, li) => (
                                            <div key={li}>
                                                {lineTokens.length === 0 ? '\n' :
                                                    lineTokens.map((t, ti) => (
                                                        <span key={ti} style={{ color: TOKEN_COLORS[t.type] || '#abb2bf' }}>
                                                            {t.text}
                                                        </span>
                                                    ))
                                                }
                                            </div>
                                        ))}
                                    </pre>
                                )}
                                {/* Actual textarea (transparent text if highlighted) */}
                                <textarea
                                    ref={textareaRef}
                                    className="absolute inset-0 w-full h-full bg-transparent p-4 outline-none resize-none font-mono text-sm leading-[22px]"
                                    style={{
                                        color: highlighted ? 'transparent' : '#abb2bf',
                                        caretColor: '#528bff',
                                        WebkitTextFillColor: highlighted ? 'transparent' : undefined,
                                    }}
                                    value={content}
                                    onChange={(e) => handleUpdateContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onScroll={handleScroll}
                                    spellCheck={false}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600">
                            <FileCode size={48} className="mb-4 opacity-20" />
                            <p className="text-sm">Select a file to start editing</p>
                            <p className="text-xs mt-2 text-gray-700">Or create a new .py file with the + button</p>
                            <p className="text-xs mt-4 text-gray-700">Ctrl+Enter = Run code</p>
                        </div>
                    )}
                </div>

                {/* TERMINAL AREA */}
                {showTerminal && (
                    <div className="h-44 border-t border-[#333] bg-[#1e1e1e] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-1 border-b border-[#333] text-xs">
                            <span className="font-bold uppercase flex items-center gap-1 text-gray-400">
                                <Terminal size={11} /> Terminal
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => {
                                    clearOutput();
                                    setTerminalOutput([{ type: 'system', text: 'Terminal cleared.' }]);
                                }} className="text-gray-500 hover:text-white" title="Clear"><Eraser size={12} /></button>
                                <button onClick={() => setShowTerminal(false)} className="text-gray-500 hover:text-white" title="Hide"><X size={12} /></button>
                            </div>
                        </div>
                        <div className="flex-1 p-2 overflow-y-auto font-mono text-xs space-y-0.5">
                            {terminalOutput.map((entry, i) => (
                                <div key={i} className={
                                    entry.type === 'command' ? 'text-yellow-400 font-bold' :
                                    entry.type === 'stderr' ? 'text-red-400' :
                                    entry.type === 'system' ? 'text-blue-400 italic' :
                                    'text-gray-200'
                                }>
                                    {entry.text}
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </div>
                )}
                {!showTerminal && (
                    <button onClick={() => setShowTerminal(true)}
                        className="p-1 border-t border-[#333] text-[10px] text-gray-500 hover:text-white text-center bg-[#252526]">
                        ▲ Show Terminal
                    </button>
                )}
            </div>

            {/* --- RIGHT ACTIVITY BAR --- */}
            <div className="w-10 bg-[#333] flex flex-col items-center py-3 gap-3 border-l border-[#252526]">
                <FileCode size={16} className="text-gray-500 hover:text-white cursor-pointer" title="Explorer" />
                <button onClick={() => setShowTerminal(t => !t)}>
                    <Terminal size={16} className={`cursor-pointer ${showTerminal ? 'text-white' : 'text-gray-500 hover:text-white'}`} title="Terminal" />
                </button>
            </div>
        </div>
    );
}