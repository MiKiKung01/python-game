//Learnแบบสวย
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Lock,
  PlayCircle,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

// ######################################################################
// ### MAIN PAGE: LearningPage
// ######################################################################
export default function LearningPage({ onNavigate, user }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

// ใน LearningPage.jsx
useEffect(() => {
  // 1. ถ้าไม่มี user ให้หยุดทำงานก่อน
  if (!user) return;

  const fetchData = async () => {
    try {
      setLoading(true);
      // 2. ดึงข้อมูลใหม่จาก API ทุกครั้งที่ user เปลี่ยนแปลง
      const res = await axios.get("http://localhost:3001/api/course-content", {
        params: { 
          user_id: user.user_id, 
          user_level: user.level // ✅ ส่งเลเวลปัจจุบันไปเช็ค
        }
      });
      setModules(res.data);
      console.log("🔄 ข้อมูลอัปเดตล่าสุดสำหรับเลเวล:", user.level);
    } catch (err) {
      console.error("❌ ดึงข้อมูลไม่สำเร็จ:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();

// 💡 หัวใจสำคัญคือตรงนี้! ใส่ [user] เพื่อบอกว่า "ถ้า user เปลี่ยน (เช่น เลเวลอัป) ให้รันฟังก์ชันข้างบนใหม่ทันที"
}, [user]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary animate-pulse">เตรียมบทเรียนให้คุณ {user?.username}...</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <HeroSection />
      
      <main className="max-w-3xl mx-auto py-12 px-4">
        {/* มาสคอตทักทาย */}
        <MascotSpeechBubble username={user?.username} />

        {/* รายการ Module ต่างๆ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
{modules.map((mod) => {
  // 1. แปลงค่าให้เป็นตัวเลขเสมอเพื่อป้องกันบั๊ก
  const reqLevel = Number(mod.required_level || 0); 
  const myLevel = Number(user?.level || 1);

  // 2. เช็คเงื่อนไข: ถ้าเลเวลเรา "น้อยกว่า" เกณฑ์ ให้ล็อค (isLocked = true)
  const isLocked = myLevel < reqLevel;

  // 3. พิมพ์เช็คใน Console ดูความจริง
  console.log(`${mod.title} -> ต้องใช้: ${reqLevel}, เลเวลหนู: ${myLevel}, ล็อคไหม: ${isLocked}`);

  return (
    <ModuleAccordion 
      key={mod.module_id} 
      moduleData={mod} 
      isLocked={isLocked} // ✅ ส่งค่าที่คำนวณได้ไปใช้งาน
      userLevel={myLevel}
    />
  );
})}
        </motion.div>

        {/* Achievement Section */}
        <div className="mt-24 text-center border-t border-white/5 pt-12">
          <div className="inline-flex p-4 bg-accent/10 rounded-full mb-4">
             <Trophy className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-2xl font-bold">{t("footer.title")}</h2>
          <p className="mt-2 text-text-secondary max-w-sm mx-auto">
            {t("footer.subtitle")}
          </p>
        </div>
      </main>
    </div>
  );
}

// ######################################################################
// ### SUB-COMPONENT: ModuleAccordion
// ######################################################################
const ModuleAccordion = ({ moduleData, isFirst, isLocked, onNavigate, userLevel }) => {
  const [isOpen, setIsOpen] = useState(isFirst);
  const { title, lessons, required_level } = moduleData;

  // คำนวณ % ความสำเร็จของ Module
  const calculateProgress = () => {
    if (!lessons || lessons.length === 0) return 0;
    const completed = lessons.reduce((sum, l) => sum + (l.completed_count || 0), 0);
    const total = lessons.reduce((sum, l) => sum + (l.total_count || 0), 0);
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className={`bg-bg-secondary rounded-2xl shadow-sm border-2 transition-all duration-300 overflow-hidden
        ${isLocked 
          ? "border-transparent opacity-60 grayscale-[0.5]" 
          : "border-white/5 hover:border-primary/30 hover:shadow-xl shadow-primary/5"
        }`}
    >
      {/* Module Header */}
      <div
        className={`flex items-center p-5 ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
        onClick={() => !isLocked && setIsOpen(!isOpen)}
      >
        <div className="flex-shrink-0 mr-4">
          {isLocked ? (
            <div className="w-14 h-14 flex items-center justify-center bg-bg-primary rounded-2xl">
              <Lock className="w-6 h-6 text-text-secondary" />
            </div>
          ) : (
            <CircularProgress progress={progress} />
          )}
        </div>

        <div className="flex-grow">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-bold text-text-primary leading-tight">{title}</h3>
            {isLocked && (
              <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Level {required_level}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary">
            {isLocked ? "เรียนรู้พื้นฐานเพิ่มเติมเพื่อปลดล็อก" : `${lessons?.length || 0} บทเรียนในหมวดนี้`}
          </p>
        </div>

        {!isLocked && (
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          </motion.div>
        )}
      </div>

      {/* Lesson List */}
      <AnimatePresence>
        {isOpen && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-black/5">
              <ul className="space-y-1">
                {lessons.map((lesson) => {
                  // เช็ค Lock รายบทเรียน (ถ้ามี)
                  const isLessonLocked = userLevel < (lesson.required_level || 0);

                  return (
                    <li
                      key={lesson.lesson_id || lesson.id}
                      className={`group flex justify-between items-center p-3 rounded-xl transition-all
                        ${isLessonLocked 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:bg-bg-primary cursor-pointer active:scale-[0.98]"
                        }`}
                      onClick={() => !isLessonLocked && onNavigate('lesson', lesson.lesson_id || lesson.id, moduleData)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${isLessonLocked ? "bg-slate-800" : "bg-primary/10 group-hover:bg-primary/20 text-primary"}`}>
                          {isLessonLocked ? <Lock className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-medium text-text-primary">{lesson.title}</span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-[11px] font-mono text-text-secondary bg-bg-primary px-2 py-1 rounded">
                          {lesson.completed_count || 0}/{lesson.total_count || 0}
                        </span>
                        {!isLessonLocked && (
                           <div className="w-6 h-6 rounded-full border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                              <ChevronDown className="w-3 h-3 -rotate-90" />
                           </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ######################################################################
// ### HELPER COMPONENTS
// ######################################################################

const HeroSection = () => {
    const { t } = useTranslation();
    return (
        <div className="relative h-[300px] w-full">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero-background.jpg')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-purple-900/40 to-transparent"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl font-extrabold text-white"
                >
                    {t('hero.title')}
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-4 text-xl text-gray-200 max-w-2xl"
                >
                    {t('hero.subtitle')}
                </motion.p>
            </div>
        </div>
    );
};


const CircularProgress = ({ progress }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center bg-bg-primary rounded-2xl shadow-inner">
      <svg className="w-12 h-12 rotate-[-90deg]">
        <circle className="text-white/5" stroke="currentColor" strokeWidth="3" fill="transparent" r={radius} cx="24" cy="24" />
        <motion.circle
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="24"
          cy="24"
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[10px] font-black text-text-primary">{progress}%</span>
    </div>
  );
};

const MascotSpeechBubble = ({ username }) => {
  const { t } = useTranslation();
  return (
<motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-bg-secondary border border-primary/20 rounded-[2rem] p-6 mb-10 shadow-xl shadow-primary/5 flex items-center space-x-6"
    >
      <div className="relative flex-shrink-0">
        <img src="/cat-mascot.png" alt="Mascot" className="h-16 w-16 drop-shadow-2xl" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-4 border-bg-secondary rounded-full"></div>
      </div>
      <div>
        <h4 className="font-bold text-primary text-base">โค้ดดี้ แมวเหลือง</h4>
        <p className="text-text-primary text-sm leading-relaxed">
          {t('mascot.welcome')}, <span className="font-bold text-accent">{username || 'นักเรียน'}</span>! 
          บทเรียนทั้งหมดพร้อมให้คุณเรียนแล้ว มาเริ่มกันเลย!
        </p>
      </div>
    </motion.div>
  );
  
};