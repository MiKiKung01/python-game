import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Terminal, Code, Cpu, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Login() {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 100);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isRegister ? '/register' : '/login';
        try {
            const res = await axios.post(`http://localhost:3001${endpoint}`, formData);
            if (res.data.success) {
                if (!isRegister) {
                    localStorage.setItem('user', JSON.stringify(res.data.user));
                    navigate('/menu');
                } else {
                    alert('ลงทะเบียนสำเร็จ! กรุณาล็อคอิน');
                    setIsRegister(false);
                }
            }
        } catch (err) {
            setError('ชื่อผู้ใช้ซ้ำ หรือ รหัสผ่านผิดพลาด!');
        }
    };

    return (
        <div className="min-h-screen bg-t-bg relative font-mono transition-colors duration-300 overflow-y-auto">
            {/* Animated Background */}
            <div className="fixed inset-0 bg-animated-gradient pointer-events-none"></div>
            <div className="fixed inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            {/* Floating Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div key={i} 
                        className="absolute w-1 h-1 rounded-full animate-float"
                        style={{ 
                            background: 'var(--t-particle-1)',
                            opacity: 0.3,
                            left: `${15 + i * 15}%`, 
                            top: `${20 + (i % 3) * 25}%`,
                            animationDelay: `${i * 0.8}s`,
                            animationDuration: `${4 + i * 0.5}s`
                        }}
                    />
                ))}
            </div>

            {/* CRT Scanline */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 2px, var(--t-boot-scanline) 2px, var(--t-boot-scanline) 4px)` }}
            />

            {/* Login Card */}
            <div className={`glass-panel rounded-2xl p-8 w-full max-w-md relative z-10 transition-all duration-700
                ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                
                {/* Neon top border */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px]"
                    style={{ background: `linear-gradient(to right, transparent, var(--t-accent), transparent)` }}></div>
                
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative p-4 rounded-2xl bg-t-accent-soft border border-t-border-accent animate-pulse-glow">
                        <Terminal size={40} className="text-t-accent" />
                        <span className="absolute -bottom-1 -right-1 text-[10px] opacity-50">🐾</span>
                    </div>
                </div>

                <h1 className="text-2xl font-black text-center text-t-text mb-1 uppercase tracking-[0.2em]">
                    {isRegister ? 'New Player' : 'System Login'}
                </h1>
                <p className="text-center text-t-muted mb-8 text-sm">
                    {isRegister ? 'สร้างบัญชีเพื่อเริ่มเขียนโค้ด' : 'ยินดีต้อนรับกลับสู่โลก Developer'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-t-accent text-xs font-bold mb-2 tracking-widest">USERNAME</label>
                        <div className="flex items-center bg-t-input border border-t-border rounded-xl px-4 py-3 
                            focus-within:border-t-border-accent focus-within:shadow-[0_0_15px_var(--t-glow)] transition-all duration-300">
                            <Code size={18} className="text-t-muted mr-3 flex-shrink-0" />
                            <input type="text" name="username"
                                className="bg-transparent w-full text-t-text focus:outline-none font-mono text-sm placeholder-t-muted"
                                placeholder="DevName101" onChange={handleChange} required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-t-accent text-xs font-bold mb-2 tracking-widest">PASSWORD</label>
                        <div className="flex items-center bg-t-input border border-t-border rounded-xl px-4 py-3
                            focus-within:border-t-border-accent focus-within:shadow-[0_0_15px_var(--t-glow)] transition-all duration-300">
                            <Cpu size={18} className="text-t-muted mr-3 flex-shrink-0" />
                            <input type="password" name="password"
                                className="bg-transparent w-full text-t-text focus:outline-none font-mono text-sm placeholder-t-muted"
                                placeholder="••••••••" onChange={handleChange} required />
                        </div>
                    </div>

                    {error && (
                        <div className="text-t-danger text-sm font-medium bg-t-danger-soft p-3 rounded-xl border border-t-danger/20 flex items-center gap-2 animate-scale-in">
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <button type="submit"
                        className="w-full relative overflow-hidden bg-t-accent hover:bg-t-accent-hover
                            text-white font-bold py-3.5 rounded-xl transition-all duration-300 uppercase tracking-wider text-sm
                            hover:shadow-[0_0_25px_var(--t-glow)] active:scale-[0.98]">
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <Sparkles size={16} />
                            {isRegister ? 'Register' : 'Access System'}
                        </span>
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => setIsRegister(!isRegister)}
                        className="text-t-muted hover:text-t-accent text-sm transition-colors duration-300">
                        {isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
                    </button>
                </div>

                {/* Subtle cat */}
                <div className="absolute -top-6 right-4 text-lg opacity-40 select-none" title="=^._.^= meow~">🐱</div>
            </div>
            </div>
        </div>
    );
}