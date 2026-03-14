import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shuffle, PlusSquare, Users, Settings, User, LogOut, X, Volume2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OnlineMenu() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [mounted, setMounted] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [createData, setCreateData] = useState({ roomName: '', maxPlayers: 2, password: '' });
    const [settingData, setSettingData] = useState({ newName: user.username || '', volume: localStorage.getItem('musicVolume') || 50 });

    useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!createData.roomName) return alert(t('onlineMenu.settingsModal.errorNameEmpty'));
        try { const res = await axios.post('http://localhost:3001/rooms/create', { ...createData, hostId: user.id }); navigate(`/lobby/${res.data.roomId}`); } catch { alert(t('onlineMenu.settingsModal.errorCreateRoom')); }
    };

    const handleSaveSettings = async () => {
        try {
            if (settingData.newName !== user.username) {
                await axios.post('http://localhost:3001/user/update', { userId: user.id, newName: settingData.newName });
                const newUser = { ...user, username: settingData.newName };
                localStorage.setItem('user', JSON.stringify(newUser)); setUser(newUser);
            }
            alert(t('onlineMenu.settingsModal.successMessage')); setShowSettingsModal(false);
        } catch { alert(t('onlineMenu.settingsModal.errorMessage')); }
    };

    const menuItems = [
        { name: t('onlineMenu.quickJoin'), sub: "Quick Join", icon: <Shuffle size={28} />, color: "from-purple-500 to-purple-700", action: () => navigate('/matchmaking') },
        { name: t('onlineMenu.createRoom'), sub: "Create", icon: <PlusSquare size={28} />, color: "from-green-500 to-green-700", action: () => setShowCreateModal(true) },
        { name: t('onlineMenu.joinList'), sub: "Join List", icon: <Users size={28} />, color: "from-blue-500 to-blue-700", action: () => navigate('/join-room') },
        { name: t('onlineMenu.solo'), sub: "Solo", icon: <User size={28} />, color: "from-cat-orange to-cat-amber", action: () => navigate('/menu') },
        { name: t('onlineMenu.settings'), sub: "Settings", icon: <Settings size={28} />, color: "from-slate-500 to-slate-700", action: () => setShowSettingsModal(true) },
        { name: t('onlineMenu.back'), sub: "Back", icon: <LogOut size={28} />, color: "from-red-500 to-red-700", action: () => navigate('/menu') },
    ];

    return (
        <div className="min-h-screen relative transition-colors duration-300 overflow-y-auto">
            <div className="fixed inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center min-h-screen p-8">
            <div className="z-10 w-full max-w-4xl">
                <h1 className={`text-4xl md:text-5xl font-black text-center mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
                    <span className="bg-gradient-to-r from-t-accent via-blue-400 to-t-accent-2 bg-clip-text text-transparent">{t('onlineMenu.title')}</span>
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems.map((item, index) => (
                        <button key={index} onClick={item.action}
                            className={`glass-panel group relative rounded-xl p-5 flex items-center gap-4
                                hover:border-t-border-accent transition-all duration-300 hover:shadow-[0_0_20px_var(--t-glow)] active:scale-[0.98]
                                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                            style={{ transitionDelay: `${200 + index * 80}ms` }}>
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${item.color} text-white group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>{item.icon}</div>
                            <div className="text-left flex-1">
                                <h2 className="text-lg font-bold text-t-text group-hover:text-t-accent transition-colors">{item.name}</h2>
                                <p className="text-t-muted text-xs">{item.sub}</p>
                            </div>
                            <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                        </button>
                    ))}
                </div>
            </div>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-t-overlay backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="glass-panel rounded-2xl p-6 w-full max-w-md relative animate-scale-in border border-t-border">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-t-muted hover:text-t-danger transition-colors"><X size={24} /></button>
                        <h2 className="text-xl font-black text-t-text mb-6 flex items-center gap-2"><PlusSquare size={20} className="text-t-success" /> {t('onlineMenu.createModal.title')}</h2>
                        <form onSubmit={handleCreateRoom} className="space-y-4">
                            <div>
                                <label className="text-t-accent text-xs font-bold tracking-widest">{t('onlineMenu.createModal.roomName')}</label>
                                <input type="text" className="w-full bg-t-input border border-t-border text-t-text p-2.5 rounded-xl mt-1.5 focus:outline-none focus:border-t-border-accent focus:shadow-[0_0_15px_var(--t-glow)] transition-all"
                                    value={createData.roomName} onChange={(e) => setCreateData({ ...createData, roomName: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-t-accent text-xs font-bold tracking-widest">{t('onlineMenu.createModal.maxPlayers')} ({createData.maxPlayers})</label>
                                <input type="range" min="2" max="5" className="w-full mt-2 accent-[var(--t-accent)] cursor-pointer"
                                    value={createData.maxPlayers} onChange={(e) => setCreateData({ ...createData, maxPlayers: parseInt(e.target.value) })} />
                                <div className="flex justify-between text-t-muted text-xs mt-1"><span>2</span><span>3</span><span>4</span><span>5</span></div>
                            </div>
                            <div>
                                <label className="text-t-accent text-xs font-bold tracking-widest">{t('onlineMenu.createModal.password')}</label>
                                <input type="text" placeholder={t('onlineMenu.createModal.passwordPlaceholder')}
                                    className="w-full bg-t-input border border-t-border text-t-text p-2.5 rounded-xl mt-1.5 focus:outline-none focus:border-t-border-accent focus:shadow-[0_0_15px_var(--t-glow)] transition-all placeholder-t-muted"
                                    value={createData.password} onChange={(e) => setCreateData({ ...createData, password: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-t-success hover:bg-t-success/80 text-white font-bold py-3 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_var(--t-glow)] active:scale-[0.98] mt-2">{t('onlineMenu.createModal.submit')}</button>
                        </form>
                    </div>
                </div>
            )}

            {showSettingsModal && (
                <div className="fixed inset-0 bg-t-overlay backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="glass-panel rounded-2xl p-6 w-full max-w-md relative animate-scale-in border border-t-border">
                        <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-t-muted hover:text-t-danger transition-colors"><X size={24} /></button>
                        <h2 className="text-xl font-black text-t-text mb-6 flex items-center gap-2"><Settings size={20} className="text-t-accent" /> {t('onlineMenu.settingsModal.title')}</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-cat-amber text-xs font-bold flex items-center gap-2 tracking-widest"><Volume2 size={14} /> {t('onlineMenu.settingsModal.musicVolume')}</label>
                                <input type="range" min="0" max="100" className="w-full mt-2 accent-[var(--t-accent)] cursor-pointer" value={settingData.volume}
                                    onChange={(e) => { const vol = e.target.value; setSettingData({ ...settingData, volume: vol }); const m = document.getElementById('bg-music'); if (m) { m.volume = vol / 100; if (m.paused) m.play(); } localStorage.setItem('musicVolume', vol); }} />
                                <div className="text-right text-t-text font-bold text-sm">{settingData.volume}%</div>
                            </div>
                            <div>
                                <label className="text-t-accent text-xs font-bold flex items-center gap-2 tracking-widest"><User size={14} /> {t('onlineMenu.settingsModal.displayName')}</label>
                                <input type="text" className="w-full bg-t-input border border-t-border text-t-text p-2.5 rounded-xl mt-1.5 focus:outline-none focus:border-t-border-accent focus:shadow-[0_0_15px_var(--t-glow)] transition-all"
                                    value={settingData.newName} onChange={(e) => setSettingData({ ...settingData, newName: e.target.value })} />
                            </div>
                            <button onClick={handleSaveSettings} className="w-full bg-t-accent hover:bg-t-accent-hover text-white font-bold py-3 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_var(--t-glow)] active:scale-[0.98] flex items-center justify-center gap-2"><Save size={16} /> {t('onlineMenu.settingsModal.saveChanges')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}