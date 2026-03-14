import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Crown, CheckCircle, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Lobby() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [roomData, setRoomData] = useState(null);
    const [players, setPlayers] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

    const fetchRoomData = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/rooms/${roomId}`);
            setRoomData(res.data.room);
            const filled = [...res.data.players];
            while (filled.length < 5) filled.push({ user_id: null });
            setPlayers(filled);
        } catch { navigate('/online'); }
    };

    useEffect(() => {
        if (!currentUser) return navigate('/');
        const enterRoom = async () => {
            try { await axios.post('http://localhost:3001/rooms/join', { roomId, userId: currentUser.id }); fetchRoomData(); } catch { fetchRoomData(); }
        };
        enterRoom();
        const interval = setInterval(fetchRoomData, 2000);
        return () => clearInterval(interval);
    }, [roomId]);

    const handleLeave = async () => {
        if (window.confirm(t('lobby.leave', "ต้องการออกจากห้องใช่ไหม?"))) {
            try { await axios.post('http://localhost:3001/rooms/leave', { roomId, userId: currentUser.id }); navigate('/online'); }
            catch { alert(t('lobby.errors.leaveFailed', "ไม่สามารถออกจากห้องได้ กรุณาลองใหม่")); }
        }
    };

    if (!roomData) return (
        <div className="min-h-screen relative overflow-y-auto transition-colors duration-300">
            <div className="fixed inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="relative z-10 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-t-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-t-muted font-mono text-sm">{t('lobby.waiting', 'CONNECTING TO LOBBY...')}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen relative transition-colors duration-300 overflow-y-auto">
            <div className="fixed inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="fixed inset-0 bg-dots-pattern opacity-15 pointer-events-none"></div>
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-8">

            <div className={`w-full max-w-5xl glass-panel rounded-2xl p-6 relative z-10 border border-t-border transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="flex justify-between items-center mb-8 border-b border-t-border pb-4">
                    <div>
                        <h2 className="text-t-muted text-xs font-bold tracking-widest">{t('lobby.title', 'CURRENT LOBBY')}</h2>
                        <h1 className="text-2xl font-black text-t-text">{roomData.room_name} <span className="text-t-muted text-lg">#{roomId}</span></h1>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-t-success-soft text-t-success font-bold text-sm border border-t-success/20">{t('lobby.statusLabel', 'STATUS:')} {roomData.status}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {players.map((p, index) => {
                        const isMe = p.user_id === currentUser.id;
                        const isHost = p.user_id === roomData.host_user_id;
                        return (
                            <div key={index}
                                className={`relative h-56 rounded-xl flex flex-col items-center justify-center transition-all duration-500 animate-fade-in-up
                                    ${p.user_id ? (isMe ? 'glass-panel border-t-border-accent shadow-[0_0_15px_var(--t-glow)]' : 'glass-panel border-t-border') : 'border border-dashed border-t-border'}`}
                                style={{ animationDelay: `${index * 100}ms`, background: p.user_id ? undefined : 'var(--t-card)' }}>
                                {p.user_id ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg bg-gradient-to-br from-t-accent to-t-accent-2 border-2 border-t-border">
                                            <User size={32} className="text-white" />
                                        </div>
                                        <div className="text-t-text px-3 py-1 rounded-lg text-sm font-bold max-w-[90%] truncate bg-t-input">
                                            {p.username} {isMe && <span className="text-t-accent">{t('lobby.you', '(YOU)')}</span>}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {isHost && <Crown size={18} className="text-cat-amber animate-float" />}
                                            <CheckCircle size={18} className="text-t-muted" />
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-t-muted font-bold text-sm tracking-wider">{t('lobby.emptySlot', 'EMPTY')}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-between items-center p-4 rounded-xl border border-t-border" style={{ background: 'var(--t-input)' }}>
                    <button onClick={handleLeave} className="px-6 py-3 rounded-xl text-t-danger font-bold text-sm bg-t-danger-soft hover:bg-t-danger/20 border border-t-danger/20 transition-all duration-300 active:scale-95">{t('lobby.leave')}</button>
                    {currentUser.id === roomData.host_user_id ? (
                        <button onClick={() => alert("Start Game!")} className="px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 bg-gradient-to-r from-cat-orange to-cat-amber text-black hover:shadow-[0_0_25px_rgba(249,115,22,0.3)] transition-all duration-300 active:scale-95">
                            <Play fill="black" size={18} /> {t('lobby.startGame')}
                        </button>
                    ) : (
                        <div className="text-t-muted font-bold text-sm animate-pulse">{t('lobby.waitHost')}</div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}