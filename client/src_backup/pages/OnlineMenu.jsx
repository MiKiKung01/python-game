import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shuffle, PlusSquare, Users, Settings, User, LogOut, X, Volume2, Save } from 'lucide-react';

export default function OnlineMenu() {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

    // State สำหรับ Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Form Data
    const [createData, setCreateData] = useState({ roomName: '', maxPlayers: 2, password: '' });
    const [settingData, setSettingData] = useState({ newName: user.username || '', volume: 50 });

    // ฟังก์ชันสร้างห้อง
    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!createData.roomName) return alert("กรุณาใส่ชื่อห้อง");

        try {
            // ส่งข้อมูลไป API สร้างห้อง
            const res = await axios.post('http://localhost:3001/rooms/create', {
                ...createData,
                hostId: user.id
            });
            // สร้างสำเร็จ -> ไปที่ห้องนั้นทันที
            navigate(`/lobby/${res.data.roomId}`);
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการสร้างห้อง");
        }
    };

    // ฟังก์ชันบันทึกการตั้งค่า
    const handleSaveSettings = async () => {
        try {
            if (settingData.newName !== user.username) {
                await axios.post('http://localhost:3001/user/update', {
                    userId: user.id,
                    newName: settingData.newName
                });
                // อัปเดต LocalStorage
                const newUser = { ...user, username: settingData.newName };
                localStorage.setItem('user', JSON.stringify(newUser));
                setUser(newUser);
            }
            alert("บันทึกการตั้งค่าเรียบร้อย!");
            setShowSettingsModal(false);
        } catch (err) {
            alert("ไม่สามารถเปลี่ยนชื่อได้");
        }
    };

    const menuItems = [
        { name: "สุ่มห้อง (Quick Join)", icon: <Shuffle size={32} />, color: "bg-purple-500", action: () => navigate('/matchmaking') },
        { name: "สร้างห้อง (Create)", icon: <PlusSquare size={32} />, color: "bg-green-500", action: () => setShowCreateModal(true) },
        { name: "ค้นหาห้อง (Join List)", icon: <Users size={32} />, color: "bg-blue-500", action: () => navigate('/join-room') }, // ต้องไปสร้าง Route ให้ตรงกันใน App.jsx
        { name: "เล่นคนเดียว (Solo)", icon: <User size={32} />, color: "bg-yellow-500", action: () => navigate('/menu') }, // กลับไป MainMenu
        { name: "ตั้งค่า (Settings)", icon: <Settings size={32} />, color: "bg-gray-600", action: () => setShowSettingsModal(true) },
        { name: "ย้อนกลับ (Back)", icon: <LogOut size={32} />, color: "bg-red-500", action: () => navigate('/menu') },
    ];

    return (
        <div className="min-h-screen bg-gray-900 p-8 font-mono flex flex-col items-center relative">
            {/* Background Grid */}
            <div className="fixed inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
            </div>

            <div className="z-10 w-full max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-center mb-12 drop-shadow-[4px_4px_0_#000]">
                    ONLINE LOBBY
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.action}
                            className={`${item.color} group relative border-4 border-black rounded-2xl p-6 flex items-center hover:-translate-y-2 transition-transform shadow-[6px_6px_0px_0px_#000000] active:translate-y-0 active:shadow-none`}
                        >
                            <div className="bg-black/20 p-4 rounded-xl mr-4 text-white group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-bold text-white uppercase">{item.name.split(' (')[0]}</h2>
                                <p className="text-white/80 text-sm">{item.name.split(' (')[1]?.replace(')', '')}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- CREATE ROOM MODAL --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border-4 border-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-red-500 hover:text-red-400"><X size={32} /></button>
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><PlusSquare /> CREATE ROOM</h2>

                        <form onSubmit={handleCreateRoom} className="space-y-4">
                            <div>
                                <label className="text-green-400 font-bold">ROOM NAME</label>
                                <input
                                    type="text"
                                    className="w-full bg-black border-2 border-gray-600 text-white p-2 rounded mt-1 focus:outline-none focus:border-green-400"
                                    value={createData.roomName}
                                    onChange={(e) => setCreateData({ ...createData, roomName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-green-400 font-bold">MAX PLAYERS ({createData.maxPlayers})</label>
                                <input
                                    type="range" min="2" max="5"
                                    className="w-full mt-2 accent-green-500 cursor-pointer"
                                    value={createData.maxPlayers}
                                    onChange={(e) => setCreateData({ ...createData, maxPlayers: parseInt(e.target.value) })}
                                />
                                <div className="flex justify-between text-gray-400 text-xs mt-1">
                                    <span>2</span><span>3</span><span>4</span><span>5</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-green-400 font-bold">PASSWORD (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="Leave empty for public"
                                    className="w-full bg-black border-2 border-gray-600 text-white p-2 rounded mt-1 focus:outline-none focus:border-green-400"
                                    value={createData.password}
                                    onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 mt-4">
                                CREATE & JOIN
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- SETTINGS MODAL --- */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-slate-800 border-4 border-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-red-500 hover:text-red-400"><X size={32} /></button>
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2"><Settings /> SETTINGS</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="text-yellow-400 font-bold flex items-center gap-2"><Volume2 size={20} /> MUSIC VOLUME</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    className="w-full mt-2 accent-yellow-400 cursor-pointer"
                                    value={settingData.volume}
                                    onChange={(e) => {
                                        // 1. ประกาศตัวแปร vol ก่อน เพื่อรับค่าจาก Slider
                                        const vol = e.target.value;

                                        // 2. อัปเดต State (เพื่อให้ Slider ขยับ)
                                        setSettingData({ ...settingData, volume: vol });

                                        // 3. ปรับเสียงเพลงจริงๆ
                                        const bgMusic = document.getElementById('bg-music');
                                        if (bgMusic) {
                                            bgMusic.volume = vol / 100; // แปลง 0-100 เป็น 0.0-1.0
                                            if (bgMusic.paused) bgMusic.play();
                                        }

                                        // 4. บันทึกลงเครื่อง
                                        localStorage.setItem('musicVolume', vol);
                                    }}
                                />
                                <div className="text-right text-white font-bold">{settingData.volume}%</div>
                            </div>

                            <div>
                                <label className="text-blue-400 font-bold flex items-center gap-2"><User size={20} /> DISPLAY NAME</label>
                                <input
                                    type="text"
                                    className="w-full bg-black border-2 border-gray-600 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-400"
                                    value={settingData.newName}
                                    onChange={(e) => setSettingData({ ...settingData, newName: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
                            >
                                <Save size={20} /> SAVE CHANGES
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}