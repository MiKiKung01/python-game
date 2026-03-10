import { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, User, Search, Frown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function JoinRoom() {
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`http://localhost:3001/rooms?search=${searchTerm}`)
            .then(res => setRooms(res.data))
            .catch(err => console.error(err));
    }, [searchTerm]);

    const handleJoin = (roomId) => {
        // ในอนาคตอาจจะมี Modal ให้กรอกรหัสผ่านตรงนี้
        navigate(`/lobby/${roomId}`);
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8 font-mono">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-4xl font-black text-white drop-shadow-[4px_4px_0_#000]">SERVER BROWSER</h1>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อห้อง..."
                            className="w-full bg-black border-2 border-gray-600 rounded-full py-2 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {rooms.length === 0 ? (
                    // --- แสดงเมื่อไม่มีห้อง ---
                    <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-gray-700 rounded-3xl bg-gray-800/50">
                        <Frown size={64} className="text-gray-500 mb-4" />
                        <h3 className="text-2xl text-gray-400 font-bold">ไม่พบห้องที่ค้นหา</h3>
                        <p className="text-gray-500">"ไม่มีใครสร้างห้อง" หรือลองเปลี่ยนคำค้นหา</p>
                    </div>
                ) : (
                    // --- แสดงรายการห้อง ---
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map(room => (
                            <div key={room.room_id} className="bg-slate-800 border-4 border-black rounded-xl p-5 hover:-translate-y-1 transition-transform shadow-lg relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <User size={64} />
                                </div>

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <h3 className="text-xl font-bold text-white truncate pr-6">{room.room_name}</h3>
                                    {room.room_password && <Lock size={20} className="text-red-500 flex-shrink-0" />}
                                </div>

                                <div className="flex items-center text-gray-300 mb-4 relative z-10 bg-black/40 p-2 rounded w-fit">
                                    <User size={16} className="mr-2" />
                                    <span className="font-bold">{room.current_players} / {room.max_players}</span>
                                </div>

                                <button
                                    onClick={() => handleJoin(room.room_id)}
                                    className="w-full bg-blue-600 py-2 rounded-lg text-white font-black border-b-4 border-blue-800 hover:bg-blue-500 active:border-b-0 active:translate-y-1 relative z-10"
                                >
                                    JOIN GAME
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button onClick={() => navigate('/online')} className="mt-8 text-gray-400 hover:text-white underline">
                    &lt; กลับไปหน้าเมนู
                </button>
            </div>
        </div>
    );
}