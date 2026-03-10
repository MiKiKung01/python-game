import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Star, ShieldAlert, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Achievements() {
    const [list, setList] = useState([]);
    const navigate = useNavigate();
    // ดึง user จาก local storage เพื่อใช้ ID
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (user) {
            axios.get(`http://localhost:3001/achievements/${user.id}`)
                .then(res => setList(res.data))
                .catch(err => console.error(err));
        }
    }, []);

    // ฟังก์ชันเลือกสีและไอคอนตามระดับความยาก
    const getDifficultyStyle = (diff) => {
        switch (diff) {
            case 'Medium': return { color: 'border-green-500', bg: 'bg-green-900/20', text: 'text-green-400', icon: <Star /> };
            case 'Hard': return { color: 'border-orange-500', bg: 'bg-orange-900/20', text: 'text-orange-400', icon: <ShieldAlert /> };
            case 'Very Hard': return { color: 'border-red-600', bg: 'bg-red-900/30', text: 'text-red-500', icon: <Trophy /> };
            default: return { color: 'border-gray-500', bg: 'bg-gray-900', text: 'text-gray-400' };
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8 font-mono relative">
            <button
                onClick={() => navigate('/menu')}
                className="absolute top-8 right-8 bg-red-500 p-2 rounded-full border-2 border-black hover:bg-red-400 z-50"
            >
                <X size={24} className="text-black" />
            </button>

            <h1 className="text-4xl font-black text-center mb-10 text-yellow-400 drop-shadow-[3px_3px_0_#000] uppercase">
                Hall of Fame
            </h1>

            <div className="max-w-4xl mx-auto space-y-4">
                {list.map((ach) => {
                    const style = getDifficultyStyle(ach.difficulty);
                    const percent = parseFloat(ach.global_percent); // แปลงเป็นตัวเลข

                    return (
                        <div
                            key={ach.achievement_id}
                            className={`relative p-5 rounded-xl border-4 ${ach.is_unlocked ? 'opacity-100 bg-slate-800' : 'opacity-60 bg-slate-900 grayscale'} ${style.color} shadow-lg transition-all hover:scale-[1.02]`}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">

                                {/* Icon & Info */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-3 rounded-lg border-2 border-black ${style.bg} ${style.text}`}>
                                        {style.icon}
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${ach.is_unlocked ? 'text-white' : 'text-gray-400'}`}>
                                            {ach.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">{ach.description}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block border ${style.color} ${style.text} bg-black`}>
                                            {ach.difficulty}
                                        </span>
                                    </div>
                                </div>

                                {/* Percentage Display */}
                                <div className="text-right min-w-[150px]">
                                    {percent === 0 ? (
                                        <div className="text-sm text-gray-500 font-bold italic">
                                            0.0%<br />ยังไม่มีใครสามารถเคลียได้
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-3xl font-black text-white">{percent.toFixed(1)}%</div>
                                            <div className="text-xs text-gray-400 uppercase">Players Completed</div>
                                        </>
                                    )}
                                </div>

                            </div>

                            {/* Unlocked Badge */}
                            {ach.is_unlocked === 1 && (
                                <div className="absolute -top-3 -right-3 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full border-2 border-black shadow-sm transform rotate-12">
                                    UNLOCKED!
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}