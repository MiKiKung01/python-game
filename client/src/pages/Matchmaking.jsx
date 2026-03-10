import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Matchmaking() {
    const navigate = useNavigate();
    const [seconds, setSeconds] = useState(0);
    const [foundPlayers, setFoundPlayers] = useState([]);
    const [isReady, setIsReady] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(s => {
                const next = s + 1;
                if (next === 5) setFoundPlayers([
                    { name: "Player1", avatar: "P1" }, { name: "You", avatar: "Me" },
                    { name: "DevX", avatar: "DX" }, { name: "CodeGod", avatar: "CG" },
                    { name: "NoobPy", avatar: "NP" }
                ]);
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleReady = () => {
        setIsReady(true);
        setTimeout(() => { alert("Game Starting!"); navigate('/online'); }, 2000);
    };

    return (
        <div className="min-h-screen relative transition-colors duration-300 overflow-y-auto">
            <div className="fixed inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="fixed inset-0 bg-dots-pattern opacity-15 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-8 px-4">

            {foundPlayers.length < 5 ? (
                <div className={`text-center z-10 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className="relative w-40 h-40 mx-auto mb-8">
                        <div className="absolute inset-0 rounded-full border-2 border-t-accent/20"></div>
                        <div className="absolute inset-4 rounded-full border border-t-accent/15"></div>
                        <div className="absolute inset-8 rounded-full border border-t-accent/10"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-t-accent rounded-full animate-ping opacity-75"></div>
                            <div className="absolute w-3 h-3 bg-t-accent rounded-full"></div>
                        </div>
                        <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '3s' }}>
                            <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left" style={{ background: 'linear-gradient(to right, var(--t-accent), transparent)' }}></div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xl opacity-50 animate-cat-tail origin-top">🐱</div>
                    </div>
                    <h2 className="text-2xl font-bold text-t-text mb-2">กำลังหาห้อง...</h2>
                    <p className="text-3xl font-mono text-t-accent mb-4">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>
                    <p className="text-t-muted text-sm">Searching for available rooms</p>
                </div>
            ) : (
                <div className="w-full max-w-4xl z-10 px-4">
                    <h2 className="text-3xl text-center mb-8 font-black animate-bounce-in">
                        <span className="bg-gradient-to-r from-t-success to-green-400 bg-clip-text text-transparent">MATCH FOUND!</span>
                    </h2>
                    <div className="flex justify-center gap-4 mb-8">
                        {foundPlayers.map((p, i) => (
                            <div key={i} className="glass-panel p-4 rounded-xl w-32 text-center animate-fade-in-up border border-t-border"
                                style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-white
                                    bg-gradient-to-br from-t-accent to-t-accent-2 shadow-[0_0_15px_var(--t-glow)]">{p.avatar}</div>
                                <p className="text-t-text text-sm font-medium">{p.name}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <button onClick={handleReady} disabled={isReady}
                            className={`px-10 py-4 text-xl font-bold rounded-2xl transition-all duration-300 active:scale-95
                                ${isReady ? 'bg-t-success text-white shadow-[0_0_25px_var(--t-glow)]' : 'bg-red-500 hover:bg-red-400 text-white hover:shadow-[0_0_25px_rgba(255,0,0,0.2)]'}`}>
                            {isReady ? "✓ READY!" : "ACCEPT"}
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}