import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Globe, Settings, Trophy, Sparkles, Palette, BookOpen, X, Volume2, User } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export default function MainMenu() {
    const navigate = useNavigate();
    const { theme, setTheme, themes } = useTheme();
    const { t, i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingData, setSettingData] = useState({ newName: JSON.parse(localStorage.getItem('user'))?.username || '', volume: localStorage.getItem('musicVolume') || 50 });

    useEffect(() => {
        setTimeout(() => setMounted(true), 100);
    }, []);

    const menus = [
        { name: t('mainMenu.simulation'), sub: "Simulation", icon: <Monitor size={24} />, color: "from-[var(--t-accent)] to-blue-600", action: () => navigate("/simulation") },
        { name: t('mainMenu.online'), sub: "Online", icon: <Globe size={24} />, color: "from-[var(--t-accent-2)] to-purple-600", action: () => navigate("/online") },
        { name: t('mainMenu.theme'), sub: "Theme", icon: <Palette size={24} />, color: "from-cat-orange to-cat-amber", action: () => setShowThemePicker(true) },
        { name: t('mainMenu.settings'), sub: "Settings", icon: <Settings size={24} />, color: "from-slate-500 to-slate-700", action: () => setShowSettingsModal(true) },
        { name: t('mainMenu.achievements'), sub: "Achievements", icon: <Trophy size={24} />, color: "from-cat-orange to-cat-amber", action: () => navigate("/achievements") },
        { name: t('mainMenu.studyMode'), sub: "Study Mode", icon: <BookOpen size={24} />, color: "from-emerald-500 to-green-600", action: () => navigate("/learn") },
    ];

    return (
        <div className="min-h-screen relative bg-t-bg transition-colors duration-300 overflow-y-auto">
            <div className="fixed inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-8 px-4">

            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute rounded-full animate-float"
                        style={{ 
                            width: `${2 + Math.random() * 4}px`, height: `${2 + Math.random() * 4}px`,
                            background: i % 3 === 0 ? 'var(--t-particle-1)' : i % 3 === 1 ? 'var(--t-particle-2)' : 'var(--t-particle-3)',
                            opacity: 0.2, left: `${10 + i * 11}%`, top: `${15 + (i % 4) * 20}%`,
                            animationDelay: `${i * 0.6}s`, animationDuration: `${4 + i * 0.7}s`
                        }}
                    />
                ))}
            </div>

            {/* Game Title */}
            <div className={`relative mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
                <h1 className="text-6xl md:text-7xl font-black text-center tracking-tight">
                    <span className="bg-gradient-to-r from-t-accent via-blue-400 to-t-accent-2 bg-clip-text text-transparent
                        drop-shadow-[0_0_30px_var(--t-glow)]">
                        PYTHON
                    </span>
                    <br />
                    <span className="text-t-text/90 text-4xl md:text-5xl tracking-[0.3em]">CODER</span>
                </h1>
                
                {/* Cat ears */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-16 opacity-40 select-none">
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-cat-orange rotate-[-15deg]"></div>
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-cat-orange rotate-[15deg]"></div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-3 text-t-muted text-sm">
                    <Sparkles size={14} className="text-t-accent" />
                    <span className="tracking-widest uppercase">{t('mainMenu.subtitle')}</span>
                    <Sparkles size={14} className="text-t-accent" />
                </div>
            </div>

            {/* Menu Buttons */}
            <div className="flex flex-col items-center gap-3 w-full max-w-sm px-4 relative z-10">
                {menus.map((menu, index) => (
                    <button key={index} onClick={menu.action}
                        className={`w-full glass-panel rounded-xl py-3.5 px-6 flex items-center gap-4 
                            hover:border-t-border-accent transition-all duration-300 group
                            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: `${300 + index * 100}ms` }}>
                        <div className={`p-2.5 rounded-lg bg-gradient-to-r ${menu.color} text-white 
                            group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                            {menu.icon}
                        </div>
                        <div className="text-left flex-1">
                            <div className="text-t-text font-bold text-sm group-hover:text-t-accent transition-colors">{menu.name}</div>
                            <div className="text-t-muted text-xs">{menu.sub}</div>
                        </div>
                        <div className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${menu.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className={`mt-8 text-t-muted text-xs tracking-wider transition-all duration-1000 delay-700
                ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <span>{t('mainMenu.version')}</span>
                <span className="mx-2">•</span>
                <span>{t('mainMenu.copyright')}</span>
                <span className="ml-2 text-cat-orange/40">😺</span>
            </div>
            </div>

            {/* Theme Picker Modal */}
            {showThemePicker && (
                <div className="fixed inset-0 bg-t-overlay backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
                    onClick={() => setShowThemePicker(false)}>
                    <div className="glass-panel rounded-2xl p-6 w-full max-w-sm animate-scale-in border border-t-border"
                        onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-t-text mb-1 flex items-center gap-2">
                            <Palette size={20} className="text-t-accent" /> {t('mainMenu.themeModal.title')}
                        </h2>
                        <p className="text-t-muted text-xs mb-4">{t('mainMenu.themeModal.subtitle')}</p>
                        <div className="space-y-2">
                            {themes.map(t => (
                                <button key={t.id} onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200
                                        ${theme.id === t.id 
                                            ? 'bg-t-accent-soft border border-t-border-accent ring-1 ring-t-accent/20' 
                                            : 'hover:bg-t-card-hover border border-t-border'}`}>
                                    <span className="text-2xl">{t.icon}</span>
                                    <div className="text-left flex-1">
                                        <div className="text-t-text text-sm font-bold">{t.name}</div>
                                        <div className="text-t-muted text-xs">{t.description}</div>
                                    </div>
                                    {theme.id === t.id && <span className="text-t-accent text-sm">✓</span>}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 p-3 rounded-xl bg-t-accent-soft border border-t-border-accent/30 text-center">
                            <p className="text-t-accent text-xs font-bold">{t('mainMenu.themeModal.storeComingSoon')}</p>
                            <p className="text-t-muted text-[10px] mt-1">{t('mainMenu.themeModal.storeDesc')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-t-overlay backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="glass-panel rounded-2xl p-6 w-full max-w-md relative animate-scale-in border border-t-border">
                        <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-t-muted hover:text-t-danger transition-colors"><X size={24} /></button>
                        <h2 className="text-xl font-black text-t-text mb-6 flex items-center gap-2"><Settings size={20} className="text-t-accent" /> {t('mainMenu.settingsModal.title')}</h2>
                        <div className="space-y-6">
                            
                            <div>
                                <label className="text-t-accent text-xs font-bold flex items-center gap-2 tracking-widest mb-2">
                                    <Globe size={14} /> {t('mainMenu.settingsModal.language')}
                                </label>
                                <div className="flex gap-2">
                                    <button 
                                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${i18n.language === 'en' ? 'bg-t-accent text-white border-t-accent shadow-[0_0_15px_var(--t-glow)]' : 'bg-t-input border-t-border text-t-text hover:bg-t-card-hover'}`}
                                        onClick={() => i18n.changeLanguage('en')}
                                    >🇬🇧 {t('mainMenu.settingsModal.englishBtn', 'English')}</button>
                                    <button 
                                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${i18n.language === 'th' ? 'bg-t-accent text-white border-t-accent shadow-[0_0_15px_var(--t-glow)]' : 'bg-t-input border-t-border text-t-text hover:bg-t-card-hover'}`}
                                        onClick={() => i18n.changeLanguage('th')}
                                    >🇹🇭 {t('mainMenu.settingsModal.thaiBtn', 'ภาษาไทย')}</button>
                                </div>
                            </div>

                            <div>
                                <label className="text-cat-amber text-xs font-bold flex items-center gap-2 tracking-widest"><Volume2 size={14} /> {t('mainMenu.settingsModal.musicVolume')}</label>
                                <input type="range" min="0" max="100" className="w-full mt-2 accent-[var(--t-accent)] cursor-pointer" value={settingData.volume}
                                    onChange={(e) => { const vol = e.target.value; setSettingData({ ...settingData, volume: vol }); const m = document.getElementById('bg-music'); if (m) { m.volume = vol / 100; if (m.paused) m.play(); } localStorage.setItem('musicVolume', vol); }} />
                                <div className="text-right text-t-text font-bold text-sm">{settingData.volume}%</div>
                            </div>
                            
                            <button onClick={() => setShowSettingsModal(false)} className="w-full bg-t-accent hover:bg-t-accent-hover text-white font-bold py-3 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_var(--t-glow)] active:scale-[0.98]">{t('mainMenu.settingsModal.saveChanges')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
