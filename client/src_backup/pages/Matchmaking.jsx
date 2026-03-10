import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Matchmaking() {
    const navigate = useNavigate();
    const [seconds, setSeconds] = useState(0);
    const [foundPlayers, setFoundPlayers] = useState([]);
    const [isReady, setIsReady] = useState(false);

    // จำลองระบบค้นหาห้อง (ใช้ [] dependency เพื่อไม่สร้าง timer ซ้ำ)
    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(s => {
                const next = s + 1;
                // จำลอง: เมื่อครบ 5 วินาที เจอผู้เล่นครบ 5 คน
                if (next === 5) {
                    setFoundPlayers([
                        { name: "Player1", avatar: "P1" }, { name: "You", avatar: "Me" },
                        { name: "DevX", avatar: "DX" }, { name: "CodeGod", avatar: "CG" },
                        { name: "NoobPy", avatar: "NP" }
                    ]);
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleReady = () => {
        setIsReady(true);
        // ถ้าทุกคนกด Ready (จำลอง) ให้เด้งไปหน้าออนไลน์ตามโจทย์
        setTimeout(() => {
            alert("Game Starting!");
            navigate('/online');
        }, 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black/90">
            {foundPlayers.length < 5 ? (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4 mx-auto"></div>
                    <h2 className="text-2xl">กำลังหาห้อง...</h2>
                    <p className="text-xl font-mono">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>
                </div>
            ) : (
                <div className="w-full max-w-4xl">
                    <h2 className="text-3xl text-center mb-8 text-green-400">MATCH FOUND!</h2>
                    <div className="flex justify-center gap-4 mb-8">
                        {foundPlayers.map((p, i) => (
                            <div key={i} className="bg-gray-800 p-4 rounded-lg w-32 text-center border-2 border-gray-600">
                                <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                    {p.avatar}
                                </div>
                                <p>{p.name}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <button
                            onClick={handleReady}
                            disabled={isReady}
                            className={`px-8 py-4 text-2xl font-bold rounded-full ${isReady ? 'bg-green-600' : 'bg-red-500 hover:bg-red-400'}`}
                        >
                            {isReady ? "READY!" : "ACCEPT"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}