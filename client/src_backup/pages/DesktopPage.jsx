import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Battery, BatteryCharging, Wifi, Volume2, Power, RefreshCw,
    Settings, Save, LogOut, Play, Monitor, Trash2, Mail, Code,
    Folder, File, UserCircle, Zap, Briefcase
} from 'lucide-react';

// --- Import Components ---
import Window from '../components/os/Window';
import DraggableIcon from '../components/os/DraggableIcon';
import CodeEditor from '../components/app/CodeEditor';
import EmailClient from '../components/app/EmailClient';
import MyComputer from '../components/app/MyComputer';
import RecycleBin from '../components/app/RecycleBin';
import JobPlatform from '../components/app/JobPlatform';
import Notepad from '../components/app/Notepad';

export default function DesktopPage() {
    const navigate = useNavigate();

    // --- 1. GAME STATE ---
    const [gameState, setGameState] = useState("BOOT");
    const [userData, setUserData] = useState(null);
    const [day, setDay] = useState(1);
    const [energy, setEnergy] = useState(100);
    const [dailySummary, setDailySummary] = useState({ earned: 0, spent: 0, events: [] });

    // --- 2. JOB SYSTEM STATE ---
    const [activeJob, setActiveJob] = useState(null);
    const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem('hasOnboarded') === 'true');
    const [jobNotification, setJobNotification] = useState(false);
    const lastJobCountRef = useRef(0);

    const RENT_DUE_DAY = 7;
    const RENT_AMOUNT = 3000;

    // --- 3. UI STATE ---
    const [currentTime, setCurrentTime] = useState(new Date());
    const [windows, setWindows] = useState([]); // { id, title, type, params }
    const [minimizedWindows, setMinimizedWindows] = useState([]);
    const [activeWindowId, setActiveWindowId] = useState(null);
    const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
    const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetFile: null });

    // --- 4. FILE SYSTEM (localStorage-backed) ---
    const [userFiles, setUserFiles] = useState(() => {
        try { return JSON.parse(localStorage.getItem('game_filesystem') || '[]'); } catch { return []; }
    });
    const [recycleBin, setRecycleBin] = useState(() => {
        try { return JSON.parse(localStorage.getItem('game_recycleBin') || '[]'); } catch { return []; }
    });

    const updateFiles = useCallback((newFiles) => {
        setUserFiles(newFiles);
        localStorage.setItem('game_filesystem', JSON.stringify(newFiles));
    }, []);

    const updateBin = useCallback((newBin) => {
        setRecycleBin(newBin);
        localStorage.setItem('game_recycleBin', JSON.stringify(newBin));
    }, []);

    // --- 5. EFFECTS ---

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) { navigate('/'); return; }
        setUserData(JSON.parse(userStr));
        setTimeout(() => setGameState("LOGIN"), 3500);
    }, []);

    useEffect(() => {
        if (gameState !== "DESKTOP") return;

        const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
        const energyTimer = setInterval(() => {
            setEnergy(prev => {
                if (prev <= 0) { handleShutdown(true); return 0; }
                return Math.max(0, prev - 0.2);
            });
        }, 1000);

        const systemTimer = setInterval(() => {
            if (userData?.id) {
                axios.get(`http://localhost:3001/simulation/status/${userData.id}`)
                    .then(res => setUserData(prev => ({ ...prev, ...res.data })))
                    .catch(err => console.error(err));

                axios.get('http://localhost:3001/jobs/available')
                    .then(res => {
                        const currentCount = res.data.length;
                        if (currentCount > lastJobCountRef.current) setJobNotification(true);
                        if (currentCount === 0) setJobNotification(false);
                        lastJobCountRef.current = currentCount;
                    })
                    .catch(err => console.error("Job fetch error", err));
            }
        }, 3000);

        let onboardTimer;
        if (!hasOnboarded) {
            onboardTimer = setTimeout(() => {
                if (!windows.find(w => w.id === 'jobs')) {
                    openApp('jobs', 'DevFreelance', 'jobs');
                    setHasOnboarded(true);
                    localStorage.setItem('hasOnboarded', 'true');
                    setJobNotification(false);
                }
            }, 1500);
        }

        const handleEsc = (e) => { if (e.key === 'Escape') setIsPauseMenuOpen(p => !p); };
        window.addEventListener('keydown', handleEsc);

        return () => {
            clearInterval(clockTimer);
            clearInterval(energyTimer);
            clearInterval(systemTimer);
            if (onboardTimer) clearTimeout(onboardTimer);
            window.removeEventListener('keydown', handleEsc);
        };
    }, [gameState, userData?.id, hasOnboarded, windows]);

    // --- 6. FUNCTIONS ---

    const openApp = (appId, title, type, params = {}) => {
        if (appId === 'jobs') setJobNotification(false);
        if (minimizedWindows.includes(appId)) {
            setMinimizedWindows(prev => prev.filter(id => id !== appId));
            setActiveWindowId(appId);
            return;
        }
        if (windows.find(w => w.id === appId)) {
            setActiveWindowId(appId);
            return;
        }
        setWindows(prev => [...prev, { id: appId, title, type, params }]);
        setActiveWindowId(appId);
        setIsStartMenuOpen(false);
    };

    const closeApp = (appId) => {
        setWindows(prev => prev.filter(w => w.id !== appId));
        setMinimizedWindows(prev => prev.filter(id => id !== appId));
    };

    const toggleMinimize = (appId) => {
        if (minimizedWindows.includes(appId)) {
            setMinimizedWindows(prev => prev.filter(id => id !== appId));
            setActiveWindowId(appId);
        } else {
            setMinimizedWindows([...minimizedWindows, appId]);
            setActiveWindowId(null);
        }
    };

    // File System helpers
    const handleCreateFile = (fileObj) => {
        updateFiles([...userFiles, fileObj]);
    };

    const handleDeleteFile = (fileId) => {
        const file = userFiles.find(f => f.id === fileId);
        if (!file) return;
        const idsToDelete = [fileId];
        const collectChildren = (parentId) => {
            userFiles.filter(f => f.parentId === parentId).forEach(child => {
                idsToDelete.push(child.id);
                if (child.type === 'folder') collectChildren(child.id);
            });
        };
        if (file.type === 'folder') collectChildren(fileId);

        const deletedItems = userFiles.filter(f => idsToDelete.includes(f.id))
            .map(f => ({ ...f, deletedAt: new Date().toISOString() }));
        updateFiles(userFiles.filter(f => !idsToDelete.includes(f.id)));
        updateBin([...recycleBin, ...deletedItems]);
    };

    const handleUpdateFile = (fileId, content) => {
        updateFiles(userFiles.map(f => f.id === fileId ? { ...f, content } : f));
    };

    const handleRestoreFile = (fileId) => {
        const item = recycleBin.find(f => f.id === fileId);
        if (!item) return;
        const { deletedAt, ...restored } = item;
        updateFiles([...userFiles, restored]);
        updateBin(recycleBin.filter(f => f.id !== fileId));
    };

    const handleDeletePermanent = (fileId) => {
        updateBin(recycleBin.filter(f => f.id !== fileId));
    };

    const handleEmptyBin = () => {
        updateBin([]);
    };

    // Open file: .txt → Notepad, .py → CodeEditor
    const handleOpenFile = (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const windowId = `file_${file.id}`;
        if (ext === 'py' || ext === 'js') {
            openApp(windowId, file.name, 'code', { folderId: file.parentId, initialFileId: file.id });
        } else {
            openApp(windowId, file.name, 'notepad', { fileId: file.id });
        }
    };

    // Context menu
    const handleContextMenu = (e, targetFile = null) => {
        e.preventDefault();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetFile });
    };

    const createNewFile = (type) => {
        const name = prompt(`Enter ${type} Name:`, type === 'Folder' ? 'New Folder' : 'new_file.txt');
        if (name) {
            handleCreateFile({
                id: Date.now(),
                name,
                type: type === 'Folder' ? 'folder' : 'file',
                parentId: null,
                content: type !== 'Folder' ? '' : undefined,
                createdAt: new Date().toISOString(),
                pos: { x: contextMenu.x, y: contextMenu.y }
            });
        }
        setContextMenu({ ...contextMenu, visible: false });
    };

    // Move file to a folder (for drag-and-drop)
    const handleMoveFile = (fileId, targetFolderId) => {
        updateFiles(userFiles.map(f => {
            if (f.id === fileId) {
                const { pos, ...rest } = f; // Remove desktop position when moving into folder
                return { ...rest, parentId: targetFolderId };
            }
            return f;
        }));
    };

    // Handle drop on RecycleBin
    const handleDropOnBin = (dragData) => {
        if (dragData?.fileId) handleDeleteFile(dragData.fileId);
    };

    // Handle drop on a folder icon
    const handleDropOnFolder = (folderId, dragData) => {
        if (dragData?.fileId && dragData.fileId !== folderId) {
            handleMoveFile(dragData.fileId, folderId);
        }
    };

    const handleDeleteFromDesktop = () => {
        if (contextMenu.targetFile) handleDeleteFile(contextMenu.targetFile.id);
        setContextMenu({ ...contextMenu, visible: false });
    };

    // Shutdown / Day
    const handleShutdown = (forced = false) => {
        const earned = Math.floor(Math.random() * 800) + 200;
        const cost = Math.random() > 0.5 ? 150 : 0;
        const events = [];
        if (forced) events.push("⚠️ หมดแรงสลบคาคอม (-10% พลังงานวันพรุ่งนี้)");
        if (cost > 0) events.push(`☕ ค่ากาแฟและขนม (-${cost} THB)`);
        else events.push("✨ วันนี้ประหยัดเงินได้ดีมาก!");
        setDailySummary({ earned, spent: cost, events });
        setGameState("SUMMARY");
    };

    const startNextDay = () => {
        setDay(d => d + 1);
        setEnergy(100);
        setGameState("DESKTOP");
    };

    const handleAcceptJob = (job) => {
        setActiveJob(job);
    };

    const handleJobComplete = () => {
        setActiveJob(null);
        closeApp('code');
    };

    // =============================================
    // RENDER WINDOW BY TYPE (fixes lag/stale props)
    // =============================================
    const renderWindow = (win) => {
        switch (win.type) {
            case 'pc':
                return <MyComputer files={userFiles} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} onOpenFile={handleOpenFile} initialFolderId={win.params?.initialFolderId} />;
            case 'bin':
                return <RecycleBin items={recycleBin} onRestore={handleRestoreFile} onDeletePermanent={handleDeletePermanent} onEmptyBin={handleEmptyBin} />;
            case 'code':
                return <CodeEditor files={userFiles} folderId={win.params?.folderId} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} onUpdateFile={handleUpdateFile} />;
            case 'notepad':
                const noteFile = userFiles.find(f => f.id === win.params?.fileId);
                return <Notepad fileId={win.params?.fileId} fileName={noteFile?.name || 'Untitled'} content={noteFile?.content || ''} onSave={handleUpdateFile} />;
            case 'mail':
                return <EmailClient />;
            case 'jobs':
                return <JobPlatform onAcceptJob={handleAcceptJob} userData={userData} files={userFiles} />;
            default:
                return <div className="p-4 text-gray-400">Unknown app</div>;
        }
    };

    // --- 7. RENDER VIEWS ---

    if (gameState === "BOOT") {
        return (
            <div className="bg-black h-screen text-green-500 font-mono p-10 cursor-none select-none">
                <div className="text-white mb-4">AMIBIOS (C) 2026 American Megatrends, Inc.</div>
                <div>CPU: Intel(R) Core(TM) i9-9900K CPU @ 3.60GHz</div>
                <div>32768MB OK</div>
                <div className="animate-pulse mt-4">Booting System...</div>
            </div>
        );
    }

    if (gameState === "LOGIN") {
        return (
            <div className="h-screen bg-cover bg-center flex flex-col items-center justify-center backdrop-blur-sm"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80')" }}>
                <div className="bg-slate-900/60 p-10 rounded-2xl backdrop-blur-md flex flex-col items-center shadow-2xl border border-white/20 animate-fade-in">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-5xl font-bold text-white mb-6 shadow-lg border-4 border-white/10">
                        {userData?.username?.[0].toUpperCase()}
                    </div>
                    <h2 className="text-3xl text-white font-bold mb-8">{userData?.username}</h2>
                    <button onClick={() => setGameState("DESKTOP")} className="bg-white/10 hover:bg-white/30 text-white px-10 py-3 rounded-full font-bold transition-all border border-white/30">
                        LOGIN
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === "SUMMARY") {
        return (
            <div className="h-screen bg-slate-900 text-white flex items-center justify-center font-mono">
                <div className="bg-slate-800 p-8 rounded-xl border-4 border-black shadow-2xl max-w-lg w-full relative">
                    <div className="absolute -top-6 -left-6 bg-yellow-400 text-black px-4 py-2 font-black rotate-[-10deg] shadow-lg border-2 border-black">
                        DAY {day} COMPLETE!
                    </div>
                    <h1 className="text-3xl font-black text-center mb-8 border-b-2 border-gray-600 pb-4">DAILY REPORT</h1>
                    <div className="space-y-4 mb-8 text-lg">
                        <div className="flex justify-between"><span>Income:</span> <span className="text-green-400 font-bold">+{dailySummary.earned} THB</span></div>
                        <div className="flex justify-between"><span>Expenses:</span> <span className="text-red-400 font-bold">-{dailySummary.spent} THB</span></div>
                        <div className="bg-black/40 p-4 rounded text-sm text-gray-300 mt-2">
                            {dailySummary.events.map((e, i) => <div key={i} className="mb-1">{e}</div>)}
                        </div>
                        <div className="bg-red-900/40 p-4 rounded border border-red-500/50 mt-6 text-center">
                            <div className="text-sm text-red-300 uppercase tracking-widest mb-1">Rent Due In</div>
                            <div className="text-5xl font-black text-white">{Math.max(0, RENT_DUE_DAY - day)} <span className="text-xl font-normal">DAYS</span></div>
                            <div className="text-sm text-red-300 mt-2">Amount: {RENT_AMOUNT.toLocaleString()} THB</div>
                        </div>
                    </div>
                    <button onClick={startNextDay} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-lg font-bold text-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1">
                        START DAY {day + 1}
                    </button>
                </div>
            </div>
        );
    }

    // --- DESKTOP RENDER ---
    return (
        <div
            className="w-screen h-screen bg-cover bg-center overflow-hidden relative font-sans select-none"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80')" }}
            onContextMenu={(e) => handleContextMenu(e)}
            onClick={() => setContextMenu({ ...contextMenu, visible: false })}
        >
            {/* --- DESKTOP ICONS --- */}
            <DraggableIcon id="pc" label="My Computer" icon={<Monitor size={32} />} initialPos={{ x: 20, y: 20 }} onOpen={() => openApp('pc', 'My Computer', 'pc')} onContextMenu={handleContextMenu} />
            <DraggableIcon id="bin" label="Recycle Bin" icon={<Trash2 size={32} />} initialPos={{ x: 20, y: 110 }} onOpen={() => openApp('bin', 'Recycle Bin', 'bin')} onContextMenu={handleContextMenu}
                isDropTarget onFileDrop={handleDropOnBin} dropHighlightColor="ring-red-400" />
            <DraggableIcon id="code" label="VS Code" icon={<Code size={32} />} initialPos={{ x: 20, y: 200 }} onOpen={() => openApp('code', 'VS Code', 'code')} onContextMenu={handleContextMenu} />

            {/* Freelance Job App */}
            <DraggableIcon
                id="jobs"
                label="Freelance"
                initialPos={{ x: 20, y: 290 }}
                onOpen={() => openApp('jobs', 'DevFreelance', 'jobs')}
                onContextMenu={handleContextMenu}
                icon={
                    <div className="relative">
                        <Briefcase size={32} />
                        {jobNotification && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span>
                            </span>
                        )}
                    </div>
                }
            />

            <DraggableIcon id="mail" label="Mail" icon={<Mail size={32} />} initialPos={{ x: 20, y: 380 }} onOpen={() => openApp('mail', 'Mail', 'mail')} onContextMenu={handleContextMenu} />
            <DraggableIcon id="settings" label="Game Menu" icon={<Settings size={32} />} initialPos={{ x: 20, y: 470 }} onOpen={() => setIsPauseMenuOpen(true)} onContextMenu={handleContextMenu} />

            {/* User Files on Desktop (root-level files with pos) */}
            {userFiles.filter(f => !f.parentId && f.pos).map(f => (
                <DraggableIcon key={f.id} id={f.id} label={f.name} initialPos={f.pos}
                    icon={f.type === 'folder' ? <Folder size={32} className="text-yellow-400" /> : <File size={32} className="text-gray-300" />}
                    onOpen={() => f.type === 'folder' ? openApp(`pc_${f.id}`, f.name, 'pc', { initialFolderId: f.id }) : handleOpenFile(f)}
                    onContextMenu={(e) => handleContextMenu(e, f)}
                    dragData={{ fileId: f.id, fileName: f.name, fileType: f.type }}
                    isDropTarget={f.type === 'folder'}
                    onFileDrop={(data) => handleDropOnFolder(f.id, data)} />
            ))}

            {/* --- WINDOWS (RENDER BY TYPE) --- */}
            {windows.map(win => (
                <div key={win.id} style={{ display: minimizedWindows.includes(win.id) ? 'none' : 'block' }}>
                    <Window id={win.id} title={win.title} onClose={() => closeApp(win.id)} onMinimize={() => toggleMinimize(win.id)} isActive={activeWindowId === win.id} onFocus={() => setActiveWindowId(win.id)}>
                        {renderWindow(win)}
                    </Window>
                </div>
            ))}

            {/* --- CONTEXT MENU --- */}
            {contextMenu.visible && (
                <div className="absolute bg-slate-800 border border-gray-600 rounded shadow-2xl py-1 w-48 z-50 text-white text-sm" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    {contextMenu.targetFile ? (
                        <>
                            <div className="px-4 py-1.5 text-xs text-slate-400 border-b border-slate-700 truncate">{contextMenu.targetFile.name}</div>
                            <button onClick={() => { handleOpenFile(contextMenu.targetFile); setContextMenu({...contextMenu, visible: false}); }} className="w-full text-left px-4 py-2 hover:bg-blue-600 flex gap-2">
                                <File size={16} /> Open
                            </button>
                            <button onClick={handleDeleteFromDesktop} className="w-full text-left px-4 py-2 hover:bg-red-600 flex gap-2"><Trash2 size={16} className="text-red-400" /> Delete</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => createNewFile('Folder')} className="w-full text-left px-4 py-2 hover:bg-blue-600 flex gap-2"><Folder size={16} className="text-yellow-400" /> New Folder</button>
                            <button onClick={() => createNewFile('File')} className="w-full text-left px-4 py-2 hover:bg-blue-600 flex gap-2"><File size={16} /> New File</button>
                        </>
                    )}
                </div>
            )}

            {/* --- PAUSE MENU --- */}
            {isPauseMenuOpen && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center">
                    <div className="bg-slate-800 border-2 border-gray-600 p-8 rounded-2xl shadow-2xl w-96">
                        <h2 className="text-3xl font-black text-white text-center mb-8 uppercase tracking-widest">PAUSE</h2>
                        <div className="space-y-4">
                            <MenuButton icon={<Play size={20} />} label="RESUME" onClick={() => setIsPauseMenuOpen(false)} primary />
                            <MenuButton icon={<Settings size={20} />} label="SETTINGS" onClick={() => alert("Settings Modal")} />
                            <MenuButton icon={<Save size={20} />} label="SAVE GAME" onClick={() => alert("Game Saved!")} />
                            <MenuButton icon={<LogOut size={20} />} label="EXIT TO TITLE" onClick={() => navigate('/menu')} danger />
                        </div>
                    </div>
                </div>
            )}

            {/* --- START MENU --- */}
            {isStartMenuOpen && (
                <div className="absolute bottom-12 left-0 w-80 bg-slate-800/95 backdrop-blur-md border border-gray-600 rounded-tr-xl shadow-2xl text-white z-[60] flex flex-col">
                    <div className="p-4 bg-slate-900 flex items-center gap-3 border-b border-gray-700">
                        <UserCircle size={40} className="text-blue-500" />
                        <div><div className="font-bold text-lg">{userData?.username}</div><div className="text-xs text-green-400">● Online</div></div>
                    </div>
                    <div className="p-3 bg-slate-900 border-t border-gray-700 flex justify-between">
                        <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded text-yellow-400 text-sm font-bold"><RefreshCw size={16} /> Restart</button>
                        <button onClick={() => handleShutdown(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 hover:text-white rounded text-red-400 text-sm font-bold"><Power size={16} /> Sleep</button>
                    </div>
                </div>
            )}

            {/* --- TASKBAR --- */}
            <div className="absolute bottom-0 w-full h-12 bg-slate-900/95 backdrop-blur border-t border-white/10 flex justify-between items-center px-2 z-[50]">
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setIsStartMenuOpen(!isStartMenuOpen); }} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-all shadow-lg">
                        <span className="font-bold tracking-wide text-sm">Start</span>
                    </button>
                    <div className="flex gap-1 ml-2">
                        {windows.map(win => (
                            <button key={win.id} onClick={() => toggleMinimize(win.id)} className={`px-3 py-1 rounded text-xs max-w-[140px] truncate border-b-2 ${activeWindowId === win.id && !minimizedWindows.includes(win.id) ? 'bg-white/10 border-blue-400 text-white' : 'text-gray-400 border-transparent'}`}>
                                {win.title}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4 px-2 h-full">
                    <div className="flex flex-col items-end mr-4">
                        <div className="text-[10px] text-yellow-500 font-bold tracking-wider flex items-center gap-1"><Zap size={10} /> STAMINA</div>
                        <div className="w-32 h-2.5 bg-gray-700 rounded-full overflow-hidden border border-gray-600 shadow-inner">
                            <div className={`h-full transition-all duration-500 ${energy < 20 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${energy}%` }}></div>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded border border-white/5 ${userData?.battery_current_charge < 20 ? 'bg-red-900/40 text-red-200' : 'bg-black/20 text-gray-300'}`}>
                        <div className="text-xs font-mono">{userData?.battery_current_charge || 100}%</div>
                        {userData?.is_plugged_in ? <BatteryCharging size={18} className="text-green-400" /> : <Battery size={18} />}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 px-3 border-l border-white/10 h-3/4">
                        <Wifi size={16} /> <Volume2 size={16} />
                    </div>
                    <div className="flex flex-col items-end justify-center leading-tight text-white px-2 h-full cursor-default">
                        <div className="text-xs font-medium">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-gray-300">{currentTime.toLocaleDateString()}</div>
                    </div>
                </div>
            </div>

        </div>
    );
}

// Helper Components
function MenuButton({ icon, label, onClick, primary, danger }) {
    let base = "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all shadow-lg border-b-4 active:border-b-0 active:translate-y-1 ";
    if (primary) base += "bg-blue-600 hover:bg-blue-500 text-white border-blue-800";
    else if (danger) base += "bg-red-600 hover:bg-red-500 text-white border-red-800";
    else base += "bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-900";
    return <button onClick={onClick} className={base}>{icon} {label}</button>;
}