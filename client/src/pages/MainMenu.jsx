import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Monitor, Globe, Settings, Trophy, LogOut, Sparkles, Palette, BookOpen } from "lucide-react";
import { useTheme } from '../contexts/ThemeContext';

export default function MainMenu() {
    const navigate = useNavigate();
    const { theme, setTheme, themes } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 100);
    }, []);

    const menus = [
        { name: "เริ่มการจำลอง", sub: "Simulation", icon: <Monitor size={24} />, color: "from-[var(--t-accent)] to-blue-600", action: () => navigate("/simulation") },
        { name: "โหมดออนไลน์", sub: "Online", icon: <Globe size={24} />, color: "from-[var(--t-accent-2)] to-purple-600", action: () => navigate("/online") },
        { name: "ธีม", sub: "Theme", icon: <Palette size={24} />, color: "from-cat-orange to-cat-amber", action: () => setShowThemePicker(true) },
        { name: "การตั้งค่า", sub: "Settings", icon: <Settings size={24} />, color: "from-slate-500 to-slate-700", action: () => alert("เปิด Modal ตั้งค่า") },
        { name: "ความสำเร็จ", sub: "Achievements", icon: <Trophy size={24} />, color: "from-cat-orange to-cat-amber", action: () => navigate("/achievements") },
        { name: "โหมดเรียน", sub: "Study Mode", icon: <BookOpen size={24} />, color: "from-emerald-500 to-green-600", action: () => navigate("/learn") },
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
                    <span className="tracking-widest uppercase">The Developer Simulation Game</span>
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
                <span>v0.1.0</span>
                <span className="mx-2">•</span>
                <span>Python Coder © 2026</span>
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
                            <Palette size={20} className="text-t-accent" /> เลือกธีม
                        </h2>
                        <p className="text-t-muted text-xs mb-4">เลือกธีมที่ชอบ • ร้านค้าธีมจะเปิดในอนาคต</p>
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
                            <p className="text-t-accent text-xs font-bold">🏪 ร้านค้าธีม Coming Soon!</p>
                            <p className="text-t-muted text-[10px] mt-1">ซื้อธีมเพิ่มเติมได้ในอนาคต</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
