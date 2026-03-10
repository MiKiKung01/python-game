import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Crown, XCircle, CheckCircle, Play } from 'lucide-react';

export default function Lobby() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const [roomData, setRoomData] = useState(null);
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState('');

    // 1. ฟังก์ชันดึงข้อมูลล่าสุด
    const fetchRoomData = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/rooms/${roomId}`);
            setRoomData(res.data.room);

            // จัด Format ผู้เล่นให้แสดงผลครบ 5 ช่อง
            const currentPlayers = res.data.players;
            const filledSlots = [...currentPlayers];
            while (filledSlots.length < 5) {
                filledSlots.push({ user_id: null });
            }
            setPlayers(filledSlots);
        } catch (err) {
            console.error("Room not found or deleted");
            navigate('/online');
        }
    };

    // 2. เริ่มทำงานเมื่อเข้าหน้าเว็บ
useEffect(() => {
    if (!currentUser) return navigate('/');

    // ฟังก์ชันสำหรับเข้าห้อง
    const enterRoom = async () => {
        try {
            // เช็คก่อนว่าเราอยู่ในห้องนี้แล้วหรือยัง?
            await axios.post('http://localhost:3001/rooms/join', { roomId, userId: currentUser.id });
            
            // เริ่มดึงข้อมูลทันที
            fetchRoomData();
        } catch (err) {
            console.error("Join failed:", err);
            fetchRoomData(); 
        }
    };

    enterRoom();

    // Polling ทุก 2 วินาที
    const interval = setInterval(fetchRoomData, 2000);
    return () => clearInterval(interval);
}, [roomId]);

    // 3. ฟังก์ชันออกจากห้อง
    const handleLeave = async () => {
        if (window.confirm("ต้องการออกจากห้องใช่ไหม?")) {
            try {
                await axios.post('http://localhost:3001/rooms/leave', { roomId, userId: currentUser.id });
                navigate('/online');
            } catch (err) {
                console.error("Leave room failed:", err);
                alert("ไม่สามารถออกจากห้องได้ กรุณาลองใหม่");
            }
        }
    };

    if (!roomData) return <div className="text-white text-center mt-20">CONNECTING TO LOBBY...</div>;

    return (
        <div className="min-h-screen bg-gray-900 font-mono flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>

            <div className="w-full max-w-5xl bg-slate-800 border-4 border-black rounded-3xl p-6 shadow-[10px_10px_0px_0px_#000] relative z-10">

                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                    <div>
                        <h2 className="text-gray-400 text-sm font-bold">CURRENT LOBBY</h2>
                        <h1 className="text-3xl font-black text-white">{roomData.room_name} #{roomId}</h1>
                    </div>
                    <div className="bg-black px-4 py-2 rounded-lg text-green-400 font-bold border-2 border-green-600">
                        STATUS: {roomData.status}
                    </div>
                </div>

                {/* Player Slots */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                    {players.map((p, index) => {
                        const isMe = p.user_id === currentUser.id;
                        const isHost = p.user_id === roomData.host_user_id;

                        return (
                            <div key={index} className={`relative h-64 border-4 rounded-2xl flex flex-col items-center justify-center transition-all 
                ${p.user_id ? (isMe ? 'bg-slate-700 border-green-500' : 'bg-slate-700 border-black') : 'bg-slate-900/50 border-gray-700 border-dashed'}`}>

                                {p.user_id ? (
                                    <>
                                        <div className={`w-20 h-20 rounded-full bg-blue-600 border-4 border-white mb-4 shadow-lg flex items-center justify-center`}>
                                            <User size={40} className="text-white" />
                                        </div>

                                        <div className="bg-black text-white px-3 py-1 rounded-full text-sm font-bold mb-2 max-w-[90%] truncate">
                                            {p.username} {isMe && "(YOU)"}
                                        </div>

                                        <div className="flex gap-2">
                                            {isHost && <Crown size={20} className="text-yellow-400" />}
                                            {/* ส่วน Ready รอทำระบบเพิ่ม */}
                                            <CheckCircle size={20} className="text-gray-500" />
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-gray-600 font-bold">EMPTY</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Action Bar */}
                <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border-2 border-black/50">
                    <button
                        onClick={handleLeave}
                        className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl border-b-4 border-red-800 hover:bg-red-500 active:border-b-0 active:translate-y-1"
                    >
                        LEAVE ROOM
                    </button>

                    {/* ปุ่ม Start แสดงเฉพาะเจ้าของห้อง (Host) */}
                    {currentUser.id === roomData.host_user_id ? (
                        <button
                            onClick={() => alert("Start Game!")}
                            className="px-8 py-3 bg-yellow-400 text-black font-black rounded-xl border-b-4 border-yellow-600 hover:bg-yellow-300 active:border-b-0 active:translate-y-1 flex items-center gap-2"
                        >
                            <Play fill="black" /> START GAME
                        </button>
                    ) : (
                        <div className="text-gray-400 font-bold animate-pulse">
                            WAITING FOR HOST...
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}