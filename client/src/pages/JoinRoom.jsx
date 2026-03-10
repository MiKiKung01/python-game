import { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, User, Search, Frown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function JoinRoom() {
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);
    useEffect(() => {
        axios.get(`http://localhost:3001/rooms?search=${searchTerm}`).then(r => setRooms(r.data)).catch(() => {});
    }, [searchTerm]);

    return (
        <div className="min-h-screen relative overflow-hidden p-8 transition-colors duration-300">
            <div className="absolute inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className={`flex flex-col md:flex-row justify-between items-center mb-8 gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    <h1 className="text-3xl font-black"><span className="bg-gradient-to-r from-t-accent to-t-accent-2 bg-clip-text text-transparent">SERVER BROWSER</span></h1>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-3 text-t-muted" size={18} />
                        <input type="text" placeholder="ค้นหาชื่อห้อง..."
                            className="w-full bg-t-input border border-t-border rounded-xl py-2.5 pl-11 pr-4 text-t-text text-sm focus:border-t-border-accent focus:outline-none focus:shadow-[0_0_15px_var(--t-glow)] transition-all placeholder-t-muted"
                            onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {rooms.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-64 glass-panel rounded-2xl border border-dashed border-t-border transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                        <Frown size={48} className="text-t-muted mb-4 animate-float" />
                        <h3 className="text-xl text-t-text-soft font-bold">ไม่พบห้องที่ค้นหา</h3>
                        <p className="text-t-muted text-sm">"ไม่มีใครสร้างห้อง" หรือลองเปลี่ยนคำค้นหา</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rooms.map((room, i) => (
                            <div key={room.room_id}
                                className={`glass-panel rounded-xl p-5 group hover:border-t-border-accent transition-all duration-300 hover:shadow-[0_0_20px_var(--t-glow)] relative overflow-hidden
                                    ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                                style={{ transitionDelay: `${200 + i * 80}ms` }}>
                                <div className="absolute top-0 right-0 p-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"><User size={48} /></div>
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <h3 className="text-lg font-bold text-t-text truncate pr-4 group-hover:text-t-accent transition-colors">{room.room_name}</h3>
                                    {room.room_password && <Lock size={16} className="text-t-danger flex-shrink-0" />}
                                </div>
                                <div className="flex items-center text-t-text-soft mb-4 relative z-10 bg-t-input px-3 py-1.5 rounded-lg w-fit text-sm">
                                    <User size={14} className="mr-2 text-t-muted" /><span className="font-medium">{room.current_players} / {room.max_players}</span>
                                </div>
                                <button onClick={() => navigate(`/lobby/${room.room_id}`)}
                                    className="w-full py-2.5 rounded-xl text-white font-bold text-sm relative z-10 bg-t-accent hover:bg-t-accent-hover hover:shadow-[0_0_15px_var(--t-glow)] transition-all duration-300 active:scale-[0.98]">
                                    JOIN GAME
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={() => navigate('/online')} className={`mt-8 text-t-muted hover:text-t-accent text-sm transition-colors duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                    ← กลับไปหน้าเมนู
                </button>
            </div>
        </div>
    );
}