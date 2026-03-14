import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Battery, BatteryCharging, Wifi, Volume2, Power, RefreshCw,
    Settings, Save, LogOut, Play, Monitor, Trash2, Mail, Code,
    Folder, File, UserCircle, Zap, Briefcase, Palette
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

import Window from '../components/os/Window';
import DraggableIcon from '../components/os/DraggableIcon';
import CodeEditor from '../components/app/CodeEditor';
import EmailClient from '../components/app/EmailClient';
import MyComputer from '../components/app/MyComputer';
import RecycleBin from '../components/app/RecycleBin';
import JobPlatform from '../components/app/JobPlatform';
import Notepad from '../components/app/Notepad';

const BIOS_LINES = [
    { text: "AMIBIOS (C) 2026 CatTech Industries =^._.^=", delay: 0, cls: "text-t-text" },
    { text: "CPU: Intel(R) Core(TM) i9-13900K @ 5.80GHz", delay: 200, cls: "text-t-text-soft" },
    { text: "Memory Test: 65536MB OK", delay: 400, cls: "text-t-text-soft" },
    { text: "Detecting Primary IDE... NVME SSD 2TB [OK]", delay: 700, cls: "text-t-success" },
    { text: "Detecting Secondary IDE... None", delay: 900, cls: "text-t-muted" },
    { text: "GPU: NVIDIA GeForce RTX 5090 24GB [OK]", delay: 1100, cls: "text-t-success" },
    { text: "Network: Ethernet 10Gbps [CONNECTED]", delay: 1300, cls: "text-t-success" },
    { text: "", delay: 1500 },
    { text: "Boot device: NVME SSD", delay: 1600, cls: "text-t-accent" },
    { text: "Loading PythonCoderOS v2.0.26...", delay: 1800, cls: "text-t-accent" },
];

export default function DesktopPage() {
    const navigate = useNavigate();
    const { theme, setTheme, themes, isDark } = useTheme();

    // --- 1. GAME STATE ---
    const [gameState, setGameState] = useState("BOOT");
    const [bootPhase, setBootPhase] = useState(0);
    const [bootLines, setBootLines] = useState([]);
    const [bootProgress, setBootProgress] = useState(0);
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
    const [windows, setWindows] = useState([]);
    const [minimizedWindows, setMinimizedWindows] = useState([]);
    const [activeWindowId, setActiveWindowId] = useState(null);
    const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
    const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetFile: null });

    // --- 4. FILE SYSTEM ---
    const [userFiles, setUserFiles] = useState(() => {
        try { return JSON.parse(localStorage.getItem('game_filesystem') || '[]'); } catch { return []; }
    });
    const [recycleBin, setRecycleBin] = useState(() => {
        try { return JSON.parse(localStorage.getItem('game_recycleBin') || '[]'); } catch { return []; }
    });

    const updateFiles = useCallback((nf) => { setUserFiles(nf); localStorage.setItem('game_filesystem', JSON.stringify(nf)); }, []);
    const updateBin = useCallback((nb) => { setRecycleBin(nb); localStorage.setItem('game_recycleBin', JSON.stringify(nb)); }, []);

    // --- 5. BOOT SEQUENCE ---
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) { navigate('/'); return; }
        setUserData(JSON.parse(userStr));

        const timers = [];
        BIOS_LINES.forEach((line) => {
            timers.push(setTimeout(() => setBootLines(prev => [...prev, line]), line.delay));
        });

        timers.push(setTimeout(() => {
            setBootPhase(1);
            let prog = 0;
            const pi = setInterval(() => {
                prog += Math.random() * 15 + 5;
                if (prog >= 100) { prog = 100; clearInterval(pi); setTimeout(() => { setBootPhase(2); setTimeout(() => setGameState("LOGIN"), 800); }, 500); }
                setBootProgress(Math.min(100, prog));
            }, 200);
            timers.push(pi);
        }, 2200));

        return () => timers.forEach(t => clearTimeout(t));
    }, []);

    // --- 6. DESKTOP EFFECTS ---
    useEffect(() => {
        if (gameState !== "DESKTOP") return;
        const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
        const energyTimer = setInterval(() => {
            setEnergy(prev => { if (prev <= 0) { handleShutdown(true); return 0; } return Math.max(0, prev - 0.2); });
        }, 1000);

        const systemTimer = setInterval(() => {
            if (userData?.id) {
                axios.get(`http://localhost:3001/simulation/status/${userData.id}`).then(r => setUserData(p => ({ ...p, ...r.data }))).catch(() => {});
                axios.get('http://localhost:3001/jobs/available').then(r => {
                    const c = r.data.length;
                    if (c > lastJobCountRef.current) setJobNotification(true);
                    if (c === 0) setJobNotification(false);
                    lastJobCountRef.current = c;
                }).catch(() => {});
            }
        }, 3000);

        let onboardTimer;
        if (!hasOnboarded) {
            onboardTimer = setTimeout(() => {
                if (!windows.find(w => w.id === 'jobs')) {
                    openApp('jobs', 'DevFreelance', 'jobs');
                    setHasOnboarded(true); localStorage.setItem('hasOnboarded', 'true'); setJobNotification(false);
                }
            }, 1500);
        }

        const handleEsc = (e) => { if (e.key === 'Escape') setIsPauseMenuOpen(p => !p); };
        window.addEventListener('keydown', handleEsc);

        return () => { clearInterval(clockTimer); clearInterval(energyTimer); clearInterval(systemTimer); if (onboardTimer) clearTimeout(onboardTimer); window.removeEventListener('keydown', handleEsc); };
    }, [gameState, userData?.id, hasOnboarded, windows]);

    // --- 7. FUNCTIONS ---
    const openApp = (appId, title, type, params = {}) => {
        if (appId === 'jobs') setJobNotification(false);
        if (minimizedWindows.includes(appId)) { setMinimizedWindows(p => p.filter(id => id !== appId)); setActiveWindowId(appId); return; }
        if (windows.find(w => w.id === appId)) { setActiveWindowId(appId); return; }
        setWindows(p => [...p, { id: appId, title, type, params }]); setActiveWindowId(appId); setIsStartMenuOpen(false);
    };
    const closeApp = (appId) => { setWindows(p => p.filter(w => w.id !== appId)); setMinimizedWindows(p => p.filter(id => id !== appId)); };
    const toggleMinimize = (appId) => {
        if (minimizedWindows.includes(appId)) { setMinimizedWindows(p => p.filter(id => id !== appId)); setActiveWindowId(appId); }
        else { setMinimizedWindows([...minimizedWindows, appId]); setActiveWindowId(null); }
    };

    const handleCreateFile = (f) => updateFiles([...userFiles, f]);
    const handleDeleteFile = (fileId) => {
        const file = userFiles.find(f => f.id === fileId); if (!file) return;
        const ids = [fileId];
        const collect = (pid) => { userFiles.filter(f => f.parentId === pid).forEach(c => { ids.push(c.id); if (c.type === 'folder') collect(c.id); }); };
        if (file.type === 'folder') collect(fileId);
        const deleted = userFiles.filter(f => ids.includes(f.id)).map(f => ({ ...f, deletedAt: new Date().toISOString() }));
        updateFiles(userFiles.filter(f => !ids.includes(f.id))); updateBin([...recycleBin, ...deleted]);
    };
    const handleUpdateFile = (fid, content) => updateFiles(userFiles.map(f => f.id === fid ? { ...f, content } : f));
    const handleRestoreFile = (fid) => { const i = recycleBin.find(f => f.id === fid); if (!i) return; const { deletedAt, ...r } = i; updateFiles([...userFiles, r]); updateBin(recycleBin.filter(f => f.id !== fid)); };
    const handleDeletePermanent = (fid) => updateBin(recycleBin.filter(f => f.id !== fid));
    const handleEmptyBin = () => updateBin([]);
    const handleOpenFile = (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase(); const wid = `file_${file.id}`;
        if (ext === 'py' || ext === 'js') openApp(wid, file.name, 'code', { folderId: file.parentId, initialFileId: file.id });
        else openApp(wid, file.name, 'notepad', { fileId: file.id });
    };
    const handleContextMenu = (e, targetFile = null) => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetFile }); };
    const createNewFile = (type) => {
        const name = prompt(`Enter ${type} Name:`, type === 'Folder' ? 'New Folder' : 'new_file.txt');
        if (name) handleCreateFile({ id: Date.now(), name, type: type === 'Folder' ? 'folder' : 'file', parentId: null, content: type !== 'Folder' ? '' : undefined, createdAt: new Date().toISOString(), pos: { x: contextMenu.x, y: contextMenu.y } });
        setContextMenu({ ...contextMenu, visible: false });
    };
    const handleMoveFile = (fid, tid) => updateFiles(userFiles.map(f => { if (f.id === fid) { const { pos, ...r } = f; return { ...r, parentId: tid }; } return f; }));
    const handleDropOnBin = (d) => { if (d?.fileId) handleDeleteFile(d.fileId); };
    const handleDropOnFolder = (fid, d) => { if (d?.fileId && d.fileId !== fid) handleMoveFile(d.fileId, fid); };
    const handleDeleteFromDesktop = () => { if (contextMenu.targetFile) handleDeleteFile(contextMenu.targetFile.id); setContextMenu({ ...contextMenu, visible: false }); };

    const handleShutdown = (forced = false) => {
        const earned = Math.floor(Math.random() * 800) + 200; const cost = Math.random() > 0.5 ? 150 : 0; const events = [];
        if (forced) events.push("⚠️ หมดแรงสลบคาคอม (-10% พลังงานวันพรุ่งนี้)");
        if (cost > 0) events.push(`☕ ค่ากาแฟและขนม (-${cost} THB)`); else events.push("✨ วันนี้ประหยัดเงินได้ดีมาก!");
        setDailySummary({ earned, spent: cost, events }); setGameState("SUMMARY");
    };
    const startNextDay = () => { setDay(d => d + 1); setEnergy(100); setGameState("DESKTOP"); };
    const handleAcceptJob = (job) => setActiveJob(job);
    const handleJobComplete = () => { setActiveJob(null); closeApp('code'); };

    const renderWindow = (win) => {
        switch (win.type) {
            case 'pc': return <MyComputer files={userFiles} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} onOpenFile={handleOpenFile} initialFolderId={win.params?.initialFolderId} />;
            case 'bin': return <RecycleBin items={recycleBin} onRestore={handleRestoreFile} onDeletePermanent={handleDeletePermanent} onEmptyBin={handleEmptyBin} />;
            case 'code': return <CodeEditor files={userFiles} folderId={win.params?.folderId} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} onUpdateFile={handleUpdateFile} />;
            case 'notepad': const nf = userFiles.find(f => f.id === win.params?.fileId); return <Notepad fileId={win.params?.fileId} fileName={nf?.name || 'Untitled'} content={nf?.content || ''} onSave={handleUpdateFile} />;
            case 'mail': return <EmailClient />;
            case 'jobs': return <JobPlatform onAcceptJob={handleAcceptJob} userData={userData} files={userFiles} />;
            default: return <div className="p-4 text-t-muted">Unknown app</div>;
        }
    };

    // =============================================
    // RENDER: BOOT SEQUENCE
    // =============================================
    if (gameState === "BOOT") {
        return (
            <div className="h-screen font-mono relative overflow-hidden select-none transition-colors duration-300"
                style={{ background: 'var(--t-boot-bg)' }}>
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 2px, var(--t-boot-scanline) 2px, var(--t-boot-scanline) 4px)` }} />

                {bootPhase === 0 && (
                    <div className="p-8 animate-fade-in">
                        {bootLines.map((line, i) => (
                            <div key={i} className={`${line.cls || 'text-t-success'} text-sm mb-0.5 animate-fade-in`}
                                style={{ animationDelay: `${i * 50}ms` }}>{line.text}</div>
                        ))}
                        <span className="inline-block w-2 h-4 bg-t-accent animate-blink mt-2"></span>
                    </div>
                )}

                {bootPhase === 1 && (
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                        <div className="mb-8 relative">
                            <div className="text-5xl font-black text-t-accent animate-neon-pulse">⟨/⟩</div>
                            <div className="absolute -top-3 -right-4 text-sm opacity-60 animate-cat-blink select-none">🐱</div>
                        </div>
                        <h2 className="text-t-text text-xl font-bold mb-2 tracking-widest">PythonCoderOS</h2>
                        <p className="text-t-muted text-xs mb-8 tracking-wider">v2.0.26 BUILD 20260227</p>
                        <div className="w-72 h-1.5 rounded-full overflow-hidden border"
                            style={{ background: 'var(--t-input)', borderColor: 'var(--t-border)' }}>
                            <div className="h-full bg-t-accent rounded-full transition-all duration-300"
                                style={{ width: `${bootProgress}%` }} />
                        </div>
                        <p className="text-t-muted text-xs mt-3 font-mono">
                            {bootProgress < 30 ? 'Loading kernel modules...' : bootProgress < 60 ? 'Initializing services...' : bootProgress < 90 ? 'Starting desktop environment...' : 'Almost ready...'}
                        </p>
                    </div>
                )}

                {bootPhase === 2 && (
                    <div className="h-full animate-fade-in" style={{ animationDuration: '0.3s', background: isDark ? 'white' : 'var(--t-bg)' }} />
                )}
            </div>
        );
    }

    // =============================================
    // RENDER: LOGIN SCREEN
    // =============================================
    if (gameState === "LOGIN") {
        return (
            <div className="h-screen relative overflow-hidden flex flex-col items-center justify-center transition-colors duration-300">
                <div className="absolute inset-0 bg-animated-gradient pointer-events-none"></div>
                <div className="absolute inset-0 bg-dots-pattern opacity-20 pointer-events-none"></div>

                <div className="glass-panel p-10 rounded-3xl flex flex-col items-center relative z-10 animate-scale-in
                    shadow-[0_0_60px_var(--t-glow)] border border-t-border">
                    <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-black text-white mb-6 relative
                        bg-gradient-to-br from-t-accent to-t-accent-2 shadow-[0_0_30px_var(--t-glow)] border-4 border-t-border animate-pulse-glow">
                        {userData?.username?.[0].toUpperCase()}
                    </div>
                    <h2 className="text-3xl text-t-text font-bold mb-2">{userData?.username}</h2>
                    <p className="text-t-muted text-sm mb-8">Welcome back, Developer</p>
                    <button onClick={() => setGameState("DESKTOP")}
                        className="px-12 py-3.5 rounded-2xl font-bold text-white text-sm tracking-wider uppercase
                        bg-t-accent-soft border border-t-border hover:border-t-border-accent
                        hover:bg-t-accent/20 hover:shadow-[0_0_25px_var(--t-glow)]
                        transition-all duration-300 active:scale-95 text-t-accent">LOGIN</button>
                    <div className="absolute -bottom-6 right-2 flex gap-3 opacity-30 text-xs select-none">
                        <span>🐾</span><span className="mt-1">🐾</span><span>🐾</span>
                    </div>
                </div>
                <div className="absolute bottom-8 text-t-muted text-sm font-mono">
                    {new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </div>
            </div>
        );
    }

    // =============================================
    // RENDER: DAILY SUMMARY
    // =============================================
    if (gameState === "SUMMARY") {
        return (
            <div className="h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300">
                <div className="absolute inset-0 bg-animated-gradient pointer-events-none"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

                <div className="glass-panel p-8 rounded-2xl max-w-lg w-full relative z-10 animate-scale-in shadow-[0_0_40px_var(--t-glow)]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full
                        bg-gradient-to-r from-cat-orange to-cat-amber text-black font-black text-sm tracking-wider
                        shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-bounce-in">
                        DAY {day} COMPLETE! 🐱
                    </div>

                    <h1 className="text-2xl font-black text-center mb-8 mt-4 text-t-text tracking-wider uppercase">Daily Report</h1>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-t-success-soft border border-t-success/20">
                            <span className="text-t-text-soft">Income</span>
                            <span className="text-t-success font-bold text-lg">+{dailySummary.earned} THB</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-t-danger-soft border border-t-danger/20">
                            <span className="text-t-text-soft">Expenses</span>
                            <span className="text-t-danger font-bold text-lg">-{dailySummary.spent} THB</span>
                        </div>

                        <div className="p-4 rounded-xl text-sm text-t-text-soft space-y-1 border border-t-border" style={{ background: 'var(--t-input)' }}>
                            {dailySummary.events.map((e, i) => <div key={i}>{e}</div>)}
                            <div className="text-cat-orange/60 text-xs mt-2 italic">เหมียว~ วันนี้ทำงานเก่งมาก!</div>
                        </div>

                        <div className="p-4 rounded-xl bg-t-danger-soft border border-t-danger/20 text-center">
                            <div className="text-xs text-t-danger uppercase tracking-widest mb-1">Rent Due In</div>
                            <div className="text-4xl font-black text-t-text">{Math.max(0, RENT_DUE_DAY - day)}
                                <span className="text-lg font-normal text-t-muted ml-2">DAYS</span>
                            </div>
                            <div className="text-xs text-t-danger mt-1">Amount: {RENT_AMOUNT.toLocaleString()} THB</div>
                        </div>
                    </div>

                    <button onClick={startNextDay}
                        className="w-full py-4 rounded-xl font-bold text-lg text-white uppercase tracking-wider
                        bg-t-accent hover:bg-t-accent-hover hover:shadow-[0_0_25px_var(--t-glow)]
                        transition-all duration-300 active:scale-[0.98]">
                        Start Day {day + 1}
                    </button>
                </div>
            </div>
        );
    }

    // =============================================
    // RENDER: DESKTOP
    // =============================================
    return (
        <div className="w-screen h-screen overflow-hidden relative font-sans select-none transition-colors duration-300"
            onContextMenu={(e) => handleContextMenu(e)}
            onClick={() => { setContextMenu({ ...contextMenu, visible: false }); setIsStartMenuOpen(false); }}>
            
            <div className="absolute inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] pointer-events-none"></div>
            <div className="absolute bottom-14 right-8 opacity-[0.04] text-[80px] select-none pointer-events-none">🐱</div>

            {/* Desktop Icons */}
            <DraggableIcon id="pc" label="My Computer" icon={<Monitor size={28} />} initialPos={{ x: 20, y: 20 }} onOpen={() => openApp('pc', 'My Computer', 'pc')} onContextMenu={handleContextMenu} />
            <DraggableIcon id="bin" label="Recycle Bin" icon={<Trash2 size={28} />} initialPos={{ x: 20, y: 110 }} onOpen={() => openApp('bin', 'Recycle Bin', 'bin')} onContextMenu={handleContextMenu} isDropTarget onFileDrop={handleDropOnBin} dropHighlightColor="ring-red-400" />
            <DraggableIcon id="code" label="VS Code" icon={<Code size={28} />} initialPos={{ x: 20, y: 200 }} onOpen={() => openApp('code', 'VS Code', 'code')} onContextMenu={handleContextMenu} />
            <DraggableIcon id="jobs" label="Freelance" initialPos={{ x: 20, y: 290 }} onOpen={() => openApp('jobs', 'DevFreelance', 'jobs')} onContextMenu={handleContextMenu}
                icon={<div className="relative"><Briefcase size={28} />{jobNotification && (<span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>)}</div>} />
            <DraggableIcon id="mail" label="Mail" icon={<Mail size={28} />} initialPos={{ x: 20, y: 380 }} onOpen={() => openApp('mail', 'Mail', 'mail')} onContextMenu={handleContextMenu} />
            <DraggableIcon id="settings" label="Game Menu" icon={<Settings size={28} />} initialPos={{ x: 20, y: 470 }} onOpen={() => setIsPauseMenuOpen(true)} onContextMenu={handleContextMenu} />

            {userFiles.filter(f => !f.parentId && f.pos).map(f => (
                <DraggableIcon key={f.id} id={f.id} label={f.name} initialPos={f.pos}
                    icon={f.type === 'folder' ? <Folder size={28} className="text-cat-amber" /> : <File size={28} className="text-t-text-soft" />}
                    onOpen={() => f.type === 'folder' ? openApp(`pc_${f.id}`, f.name, 'pc', { initialFolderId: f.id }) : handleOpenFile(f)}
                    onContextMenu={(e) => handleContextMenu(e, f)} dragData={{ fileId: f.id, fileName: f.name, fileType: f.type }}
                    isDropTarget={f.type === 'folder'} onFileDrop={(data) => handleDropOnFolder(f.id, data)} />
            ))}

            {/* Windows */}
            {windows.map(win => (
                <div key={win.id} style={{ display: minimizedWindows.includes(win.id) ? 'none' : 'block' }}>
                    <Window id={win.id} title={win.title} onClose={() => closeApp(win.id)} onMinimize={() => toggleMinimize(win.id)} isActive={activeWindowId === win.id} onFocus={() => setActiveWindowId(win.id)}>
                        {renderWindow(win)}
                    </Window>
                </div>
            ))}

            {/* Context Menu */}
            {contextMenu.visible && (
                <div className="absolute glass-panel rounded-xl shadow-2xl py-1.5 w-48 z-50 text-t-text text-sm animate-slide-menu overflow-hidden"
                    style={{ top: contextMenu.y, left: contextMenu.x }}>
                    {contextMenu.targetFile ? (
                        <>
                            <div className="px-4 py-1.5 text-xs text-t-muted border-b border-t-border truncate">{contextMenu.targetFile.name}</div>
                            <button onClick={() => { handleOpenFile(contextMenu.targetFile); setContextMenu({...contextMenu, visible: false}); }}
                                className="w-full text-left px-4 py-2.5 hover:bg-t-card-hover flex gap-2 items-center transition-colors"><File size={14} /> Open</button>
                            <button onClick={handleDeleteFromDesktop}
                                className="w-full text-left px-4 py-2.5 hover:bg-t-danger-soft flex gap-2 items-center text-t-danger transition-colors"><Trash2 size={14} /> Delete</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => createNewFile('Folder')} className="w-full text-left px-4 py-2.5 hover:bg-t-card-hover flex gap-2 items-center transition-colors"><Folder size={14} className="text-cat-amber" /> New Folder</button>
                            <button onClick={() => createNewFile('File')} className="w-full text-left px-4 py-2.5 hover:bg-t-card-hover flex gap-2 items-center transition-colors"><File size={14} /> New File</button>
                        </>
                    )}
                </div>
            )}

            {/* Pause Menu */}
            {isPauseMenuOpen && (
                <div className="absolute inset-0 bg-t-overlay backdrop-blur-md z-[60] flex items-center justify-center animate-fade-in">
                    <div className="glass-panel p-8 rounded-2xl shadow-2xl w-96 animate-scale-in border border-t-border">
                        <h2 className="text-2xl font-black text-t-text text-center mb-8 uppercase tracking-[0.3em]">Pause</h2>
                        <div className="space-y-3">
                            <MenuButton icon={<Play size={18} />} label="RESUME" onClick={() => setIsPauseMenuOpen(false)} primary />
                            <MenuButton icon={<Palette size={18} />} label="CHANGE THEME" onClick={() => {
                                const idx = themes.findIndex(t => t.id === theme.id);
                                setTheme(themes[(idx + 1) % themes.length].id);
                            }} />
                            <MenuButton icon={<Settings size={18} />} label="SETTINGS" onClick={() => alert("Settings Modal")} />
                            <MenuButton icon={<Save size={18} />} label="SAVE GAME" onClick={() => alert("Game Saved!")} />
                            <MenuButton icon={<LogOut size={18} />} label="EXIT TO TITLE" onClick={() => navigate('/menu')} danger />
                        </div>
                    </div>
                </div>
            )}

            {/* Start Menu */}
            {isStartMenuOpen && (
                <div className="absolute bottom-12 left-0 w-80 glass-panel rounded-tr-2xl rounded-tl-2xl shadow-2xl text-t-text z-[60] flex flex-col animate-slide-menu overflow-hidden"
                    onClick={e => e.stopPropagation()}>
                    <div className="p-4 flex items-center gap-3 border-b border-t-border" style={{ background: 'var(--t-input)' }}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-t-accent to-t-accent-2 flex items-center justify-center">
                            <UserCircle size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-t-text">{userData?.username}</div>
                            <div className="text-xs text-t-success flex items-center gap-1"><span className="w-1.5 h-1.5 bg-t-success rounded-full"></span> Online</div>
                        </div>
                    </div>
                    <div className="p-3 border-t border-t-border flex justify-between">
                        <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-3 py-2 hover:bg-t-card-hover rounded-lg text-cat-amber text-sm font-medium transition-colors"><RefreshCw size={14} /> Restart</button>
                        <button onClick={() => handleShutdown(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-t-danger-soft rounded-lg text-t-danger text-sm font-medium transition-colors"><Power size={14} /> Sleep</button>
                    </div>
                </div>
            )}

            {/* Taskbar */}
            <div className="absolute bottom-0 w-full h-12 glass-panel border-t border-t-border flex justify-between items-center px-2 z-[50]">
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setIsStartMenuOpen(!isStartMenuOpen); }}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white transition-all duration-200
                        bg-gradient-to-r from-cat-orange/80 to-cat-amber/80 hover:from-cat-orange hover:to-cat-amber
                        hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-95">
                        <span className="text-sm">🐱</span><span className="font-bold tracking-wide text-xs">Start</span>
                    </button>
                    <div className="w-px h-6 bg-t-border mx-1"></div>
                    <div className="flex gap-1 ml-1">
                        {windows.map(win => (
                            <button key={win.id} onClick={() => toggleMinimize(win.id)}
                                className={`px-3 py-1.5 rounded-md text-xs max-w-[140px] truncate transition-all duration-200
                                ${activeWindowId === win.id && !minimizedWindows.includes(win.id)
                                    ? 'bg-t-accent-soft text-t-text border-b-2 border-t-accent'
                                    : 'text-t-muted hover:bg-t-card-hover border-b-2 border-transparent'}`}>
                                {win.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 px-2 h-full">
                    <div className="flex flex-col items-end mr-2">
                        <div className="text-[9px] text-cat-amber font-bold tracking-wider flex items-center gap-1 mb-0.5"><Zap size={9} /> STAMINA</div>
                        <div className="w-28 h-2 rounded-full overflow-hidden border border-t-border" style={{ background: 'var(--t-input)' }}>
                            <div className={`h-full transition-all duration-500 rounded-full ${energy < 20 ? 'bg-red-500 animate-pulse' : energy < 50 ? 'bg-yellow-500' : 'bg-t-success'}`}
                                style={{ width: `${energy}%` }} />
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono
                        ${userData?.battery_current_charge < 20 ? 'bg-t-danger-soft text-t-danger' : 'bg-t-card text-t-text-soft'}`}>
                        <span>{userData?.battery_current_charge || 100}%</span>
                        {userData?.is_plugged_in ? <BatteryCharging size={14} className="text-t-success" /> : <Battery size={14} />}
                    </div>
                    <div className="w-px h-6 bg-t-border"></div>
                    <div className="flex items-center gap-2.5 text-t-muted px-1"><Wifi size={13} /><Volume2 size={13} /></div>
                    <div className="w-px h-6 bg-t-border"></div>
                    <div className="flex flex-col items-end justify-center leading-tight text-t-text px-1.5 h-full cursor-default">
                        <div className="text-xs font-medium">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[9px] text-t-muted">{currentTime.toLocaleDateString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MenuButton({ icon, label, onClick, primary, danger }) {
    let base = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm active:scale-[0.98] ";
    if (primary) base += "bg-t-accent hover:bg-t-accent-hover text-white hover:shadow-[0_0_20px_var(--t-glow)]";
    else if (danger) base += "bg-t-danger-soft hover:bg-t-danger/20 text-t-danger border border-t-danger/20";
    else base += "bg-t-card hover:bg-t-card-hover text-t-text-soft border border-t-border";
    return <button onClick={onClick} className={base}>{icon} {label}</button>;
}