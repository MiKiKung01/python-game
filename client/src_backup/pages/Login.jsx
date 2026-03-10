import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Terminal, Code, Cpu } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

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
                    // เก็บ User ID ไว้ใช้งาน
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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden font-mono">
            {/* Background Decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="bg-slate-800 border-4 border-black rounded-3xl p-8 w-full max-w-md shadow-[8px_8px_0px_0px_#000000] relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="bg-yellow-400 p-4 rounded-full border-4 border-black">
                        <Terminal size={48} className="text-black" />
                    </div>
                </div>

                <h1 className="text-3xl font-black text-center text-white mb-2 uppercase tracking-wider">
                    {isRegister ? 'New Player' : 'System Login'}
                </h1>
                <p className="text-center text-gray-400 mb-8 text-sm">
                    {isRegister ? 'สร้างบัญชีเพื่อเริ่มเขียนโค้ด' : 'ยินดีต้อนรับกลับสู่โลก Developer'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-green-400 font-bold mb-1">USERNAME</label>
                        <div className="flex items-center bg-black border-2 border-gray-600 rounded-lg px-3 py-2">
                            <Code size={20} className="text-gray-500 mr-2" />
                            <input
                                type="text"
                                name="username"
                                className="bg-transparent w-full text-white focus:outline-none font-mono"
                                placeholder="DevName101"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-green-400 font-bold mb-1">PASSWORD</label>
                        <div className="flex items-center bg-black border-2 border-gray-600 rounded-lg px-3 py-2">
                            <Cpu size={20} className="text-gray-500 mr-2" />
                            <input
                                type="password"
                                name="password"
                                className="bg-transparent w-full text-white focus:outline-none font-mono"
                                placeholder="••••••••"
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-sm font-bold bg-red-900/30 p-2 rounded border border-red-500">{error}</div>}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all uppercase"
                    >
                        {isRegister ? 'Register' : 'Access System'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-gray-400 hover:text-white underline text-sm"
                    >
                        {isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
                    </button>
                </div>
            </div>
        </div>
    );
}