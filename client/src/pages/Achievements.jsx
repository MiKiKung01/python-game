import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Star, ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Achievements() {
    const [list, setList] = useState([]);
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();
    const { t } = useTranslation();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        setTimeout(() => setMounted(true), 100);
        if (user) axios.get(`http://localhost:3001/achievements/${user.id}`).then(r => setList(r.data)).catch(() => {});
    }, []);

    const getDifficultyStyle = (diff) => {
        switch (diff) {
            case 'Medium': return { color: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-500', icon: <Star size={20} /> };
            case 'Hard': return { color: 'border-cat-orange/30', bg: 'bg-cat-orange/10', text: 'text-cat-orange', icon: <ShieldAlert size={20} /> };
            case 'Very Hard': return { color: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-500', icon: <Trophy size={20} /> };
            default: return { color: 'border-t-border', bg: 'bg-t-card', text: 'text-t-muted', icon: <Star size={20} /> };
        }
    };

    return (
        <div className="min-h-screen relative p-8 transition-colors duration-300 overflow-y-auto">
            <div className="fixed inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="fixed inset-0 bg-grid-pattern opacity-15 pointer-events-none"></div>

            <button onClick={() => navigate('/menu')}
                className="fixed top-6 right-6 glass-panel p-2.5 rounded-xl hover:bg-t-danger-soft hover:border-t-danger/20 text-t-muted hover:text-t-danger transition-all z-50">
                <X size={20} />
            </button>

            <h1 className={`text-3xl font-black text-center mb-10 relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                <span className="bg-gradient-to-r from-cat-amber via-yellow-400 to-cat-orange bg-clip-text text-transparent">{t('achievements.title', 'HALL OF FAME')}</span>
                <span className="ml-3 text-lg opacity-50">🏆🐱</span>
            </h1>

            <div className="max-w-4xl mx-auto space-y-3 relative z-10">
                {list.map((ach, i) => {
                    const style = getDifficultyStyle(ach.difficulty);
                    const percent = parseFloat(ach.global_percent);
                    return (
                        <div key={ach.achievement_id}
                            className={`relative p-5 rounded-xl glass-panel border transition-all duration-500 group
                                ${ach.is_unlocked ? 'opacity-100' : 'opacity-50 grayscale'} ${style.color}
                                hover:border-t-border-accent hover:shadow-[0_0_20px_var(--t-glow)]
                                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                            style={{ transitionDelay: `${200 + i * 60}ms` }}>
                            {ach.is_unlocked === 1 && (
                                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"><div className="shimmer-effect absolute inset-0"></div></div>
                            )}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-3 rounded-xl ${style.bg} ${style.text} border ${style.color}`}>{style.icon}</div>
                                    <div>
                                        <h3 className={`text-lg font-bold ${ach.is_unlocked ? 'text-t-text' : 'text-t-muted'} group-hover:text-t-accent transition-colors`}>{ach.name}</h3>
                                        <p className="text-sm text-t-muted mt-0.5">{ach.description}</p>
                                        <span className={`text-xs px-2.5 py-0.5 rounded-lg mt-2 inline-block ${style.bg} ${style.text} border ${style.color}`}>{ach.difficulty}</span>
                                    </div>
                                </div>
                                <div className="text-right min-w-[130px]">
                                    {percent === 0 ? (
                                        <div className="text-sm text-t-muted italic">0.0%<br />{t('achievements.locked', 'LOCKED')}</div>
                                    ) : (
                                        <><div className="text-3xl font-black text-t-text">{percent.toFixed(1)}%</div><div className="text-xs text-t-muted uppercase tracking-wider">{t('achievements.progress', 'Completed')}</div></>
                                    )}
                                </div>
                            </div>
                            {ach.is_unlocked === 1 && (
                                <div className="absolute -top-2 -right-2 px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-cat-orange to-cat-amber text-black shadow-[0_0_10px_rgba(249,115,22,0.4)] animate-bounce-in">UNLOCKED! ✨</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}