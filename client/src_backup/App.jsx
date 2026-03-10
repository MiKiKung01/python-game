import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './pages/MainMenu';
import OnlineMenu from './pages/OnlineMenu';
import Login from './pages/Login';
import Matchmaking from './pages/Matchmaking';
import Lobby from './pages/Lobby';
import JoinRoom from './pages/JoinRoom';
import Achievements from './pages/Achievements';
import DesktopPage from './pages/DesktopPage';

export default function App() {
  const audioRef = useRef(null);

  // ตั้งค่าความดังเริ่มต้นเมื่อเปิดเว็บ
  useEffect(() => {
    const savedVolume = localStorage.getItem('musicVolume') || 50;
    if (audioRef.current) {
      audioRef.current.volume = savedVolume / 100;
      
      // สั่งเล่นเพลงอัตโนมัติ (Browser ส่วนใหญ่จะบล็อกถ้า user ยังไม่คลิกอะไร
      // แต่ใส่ไว้ก่อน เผื่อ user คลิกหน้าเว็บแล้วมันจะเล่นเอง
      audioRef.current.play().catch(e => console.log("รอ User คลิกหน้าเว็บก่อนเล่นเพลง"));
    }
  }, []);

  return (
    <BrowserRouter>
      {/* --- ส่วนเล่นเพลง Background --- */}
      {/* loop = เล่นวนซ้ำ, hidden = ไม่ต้องโชว์แถบ player */}
      <audio 
        ref={audioRef} 
        id="bg-music" 
        src="/assets/music/Monplaisir.mp3" 
        loop 
        hidden 
      />

      <div className="min-h-screen bg-gray-900 text-white font-sans">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/online" element={<OnlineMenu />} />
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/lobby/:roomId" element={<Lobby />} />
          <Route path="/join-room" element={<JoinRoom />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/simulation" element={<DesktopPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
