import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Target, FlaskConical, Store, Globe, LogOut, Monitor, GraduationCap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- Friend's Learning Pages ---
import LearningPage from './pages/LearningPage';
import ShopPage from './pages/ShopPage';
import LessonPage from './pages/LessonPage';
import ExercisePage from './pages/ExercisePage';
import FriendLoginPage from './pages/FriendLogin';

// --- Your Original Pages ---
import MainMenu from './pages/MainMenu';
import OnlineMenu from './pages/OnlineMenu';
import Matchmaking from './pages/Matchmaking';
import Lobby from './pages/Lobby';
import JoinRoom from './pages/JoinRoom';
import Achievements from './pages/Achievements';
import DesktopPage from './pages/DesktopPage';

// ######################################################################
// ### MAIN APP
// ######################################################################
export default function App() {
  const audioRef = useRef(null);

  useEffect(() => {
    const savedVolume = localStorage.getItem('musicVolume') || 50;
    if (audioRef.current) {
      audioRef.current.volume = savedVolume / 100;
      audioRef.current.play().catch(e => console.log("รอ User คลิกหน้าเว็บก่อนเล่นเพลง"));
    }
  }, []);

  return (
    <BrowserRouter>
      <audio
        ref={audioRef}
        id="bg-music"
        src="/assets/music/Monplaisir.mp3"
        loop
        hidden
      />
      <AppContent />
    </BrowserRouter>
  );
}

// ######################################################################
// ### APP CONTENT (Inside Router)
// ######################################################################
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // === Auth State ===
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const defaultGuest = {
      user_id: `guest_${Math.random().toString(36).substr(2, 9)}`,
      username: 'Guest User',
      role: 'guest',
      level: 1,
      isGuest: true
    };

    if (!savedUser || (savedUser.isGuest && savedUser.level !== defaultGuest.level)) {
      localStorage.setItem('user', JSON.stringify(defaultGuest));
      setUser(defaultGuest);
      if (savedUser) window.location.reload();
    } else {
      setUser(savedUser);
    }
  }, []);

  // === Login Success ===
  const handleLoginSuccess = (userData) => {
    const authenticatedUser = { ...userData, isGuest: false };
    setUser(authenticatedUser);
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    navigate('/learn');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  // === Lesson Navigation (Bridge for friend's onNavigate) ===
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);

  const handleNavigate = (page, lessonId = null, module = null) => {
    if (lessonId) setCurrentLessonId(lessonId);
    if (module) setCurrentModule(module);

    const routeMap = {
      'learn': '/learn',
      'lesson': '/lesson',
      'exercise': '/exercise',
      'shop': '/shop',
      'login': '/',
      'simulation': '/simulation',
    };
    navigate(routeMap[page] || `/${page}`);
  };

  // === Theme Effect ===
  const [activeEffects, setActiveEffects] = useState({ theme: 'default' });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeEffects.theme.replace('theme-', ''));
  }, [activeEffects.theme]);

  // === Which pages show the Navbar ===
  const hideNavbar = ['/', '/login'].includes(location.pathname);
  const simulationRoutes = ['/simulation', '/menu', '/online', '/matchmaking', '/join-room', '/achievements'];
  const isSimulationMode = simulationRoutes.some(r => location.pathname.startsWith(r)) || location.pathname.startsWith('/lobby');

  return (
    <div className="min-h-screen bg-t-bg text-t-text font-sans transition-colors duration-300">
      {/* NAVBAR — Hide on login AND simulation routes */}
      <AnimatePresence>
        {!hideNavbar && !isSimulationMode && (
          <motion.div
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <AppNavbar
              user={user}
              onLogout={handleLogout}
              isSimulationMode={isSimulationMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ROUTES with page transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isSimulationMode ? 'sim' : 'study'}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Routes location={location}>
            {/* Friend's Login (Home page) */}
            <Route path="/" element={
              <FriendLoginPage onLoginSuccess={handleLoginSuccess} />
            } />

            {/* Friend's Learning Pages */}
            <Route path="/learn" element={
              <LearningPage onNavigate={handleNavigate} user={user} />
            } />
            <Route path="/shop" element={
              <ShopPage user={user} />
            } />
            <Route path="/lesson" element={
              <LessonPage
                lessonId={currentLessonId}
                module={currentModule}
                onNavigate={handleNavigate}
                user={user}
              />
            } />
            <Route path="/exercise" element={
              <ExercisePage onNavigate={handleNavigate} user={user} />
            } />

            {/* Simulation Pages */}
            <Route path="/menu" element={<MainMenu />} />
            <Route path="/online" element={<OnlineMenu />} />
            <Route path="/matchmaking" element={<Matchmaking />} />
            <Route path="/lobby/:roomId" element={<Lobby />} />
            <Route path="/join-room" element={<JoinRoom />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/simulation" element={<MainMenu />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ######################################################################
// ### NAVBAR (Friend's style + Simulation button)
// ######################################################################
const AppNavbar = ({ user, onLogout, isSimulationMode }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const navItems = [
    { name: t('navbar.learn', 'Learn'), icon: BookOpen, path: '/learn' },
    { name: t('navbar.debug', 'Debug Lab'), icon: FlaskConical, path: '/exercise' },
    { name: t('navbar.challenge', 'Challenge'), icon: Target, path: '/achievements' },
    { name: t('navbar.shop', 'Shop'), icon: Store, path: '/shop' },
  ];

  return (
    <nav className="w-full bg-bg-secondary shadow-sm sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* LEFT — Logo + Nav Items */}
          <div className="flex items-center space-x-8">
            <div className="cursor-pointer" onClick={() => navigate('/learn')}>
              <img className="h-9 w-9" src="/cat-logo.png" alt="Logo" />
            </div>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Language, Auth, Mode Toggle */}
          <div className="flex items-center space-x-4">

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="p-2 rounded-full hover:bg-bg-primary transition-colors text-text-secondary"
              >
                <Globe className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-32 bg-bg-secondary rounded-xl shadow-xl border border-white/10 overflow-hidden z-50"
                  >
                    <button
                      onClick={() => { i18n.changeLanguage('en'); setLangMenuOpen(false); }}
                      className="block w-full px-4 py-3 text-left hover:bg-bg-primary text-sm"
                    >
                      🇬🇧 English
                    </button>
                    <button
                      onClick={() => { i18n.changeLanguage('th'); setLangMenuOpen(false); }}
                      className="block w-full px-4 py-3 text-left hover:bg-bg-primary text-sm"
                    >
                      🇹🇭 ภาษาไทย
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

            {/* Auth Section */}
            {user?.isGuest ? (
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                Login
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-bold text-primary">LV.{user?.level || 1}</span>
                  <span className="text-[11px] text-text-secondary">{user?.username}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-full hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* MODE TOGGLE BUTTON — Simulation / Study Mode */}
            {!user?.isGuest && (
              <button
                onClick={() => navigate('/simulation')}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold shadow transition-all
                  bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 hover:shadow-yellow-400/30 hover:brightness-110 hover:scale-105"
              >
                <Monitor className="h-4 w-4" />
                <span>Simulation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
