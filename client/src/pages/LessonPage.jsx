import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

export default function LessonPage({ onNavigate, lessonId, moduleData }) {


  
  /* ================= BASIC INFO ================= */
  const lessonInfo = moduleData?.lessons?.find(
    l => String(l.id) === String(lessonId)
  );

  const lessonFullTitle = lessonInfo
    ? `บทเรียน ${lessonId} ${lessonInfo.title}`
    : `บทเรียน ${lessonId}`;

  /* ================= STATE ================= */
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);

  /* ================= QUIZ STATE ================= */
  const [answersByQuiz, setAnswersByQuiz] = useState({ pre: {}, post: {} });
  const [scores, setScores] = useState({ pre: null, post: null });
  const [quizLocked, setQuizLocked] = useState({ pre: false, post: false });
  const [quizErrors, setQuizErrors] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  const slide = slides[currentSlide];

  
  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);

        const slidesRes = await fetch(
          `http://localhost:3001/api/lessons/${lessonId}/slides`
        );
        const slidesData = await slidesRes.json();

        const lessonSlides = Array.isArray(slidesData)
          ? slidesData.map(s => ({
              title: s.title,
              src: s.slide_src,
              content: s.slide_content,
              code: s.slide_type === "code",
              video: s.slide_type === "video",
              quiz: false
            }))
          : [];

        const quizRes = await fetch(
          `http://localhost:3001/api/lessons/${lessonId}/quizzes`
        );
        const rawQuizData = await quizRes.json();
        const quizData = Array.isArray(rawQuizData) ? rawQuizData : [];

        const quizSlides = quizData.map(q => ({
          title: q.quiz_type === "pre" ? "Pre-Test" : "Post-Test",
          quiz: true,
          quizId: q.quiz_type,
          questions: q.questions.map(qq => ({
            question: qq.question_text,
            choices: qq.choices?.map(c => c.choice_text) || [],
            answer: qq.correct_answer,
            type: qq.question_type === "fill" ? "fill" : "choice"
          }))
        }));

        setSlides([
          ...quizSlides.filter(q => q.quizId === "pre"),
          ...lessonSlides,
          ...quizSlides.filter(q => q.quizId === "post")
        ]);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  /* ================= RESET WHEN LESSON CHANGE ================= */
  useEffect(() => {
    setCurrentSlide(0);
    setAnswersByQuiz({ pre: {}, post: {} });
    setScores({ pre: null, post: null });
    setQuizLocked({ pre: false, post: false });
    setQuizErrors({});
    setShowSummary(false);
    setOutput(null);
  }, [lessonId]);

  /* ================= CODE RUN (MOCK) ================= */
  const runCode = () => {
    setIsRunning(true);
    setOutput(null);

    setTimeout(() => {
      setOutput("Hello World!");
      setIsRunning(false);
    }, 800);
  };

  /* ================= NAV ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        กำลังโหลดบทเรียน...
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        ไม่พบบทเรียน
      </div>
    );
  }

  const hasPrev = currentSlide > 0;
  const hasNext = currentSlide < slides.length - 1;

  const isQuiz = slide.quiz;
  const quizId = slide.quizId;
  const isLocked = isQuiz ? quizLocked[quizId] : false;
  const answers = isQuiz ? answersByQuiz[quizId] : {};

  const canGoNext = () => {
    if (!isQuiz) return true;
    return quizLocked[quizId];
  };

  /* ================= SUBMIT QUIZ ================= */
  const submitQuiz = () => {
    let score = 0;
    const errors = {};

    slide.questions.forEach((q, i) => {
      const userAnswer = answers[i];

      if (!userAnswer || userAnswer === "") {
        errors[i] = true;
        return;
      }

      if (q.type === "fill") {
        if (
          userAnswer.trim().toLowerCase() ===
          String(q.answer).trim().toLowerCase()
        ) {
          score++;
        }
      } else {
        if (userAnswer === q.answer) score++;
      }
    });

    if (Object.keys(errors).length > 0) {
      setQuizErrors(errors);
      return;
    }

    setQuizErrors({});
    setScores(prev => ({ ...prev, [quizId]: score }));
    setQuizLocked(prev => ({ ...prev, [quizId]: true }));

    if (quizId === "post") {
      setShowSummary(true);
    }
  };

  /* ================= SUMMARY CALC ================= */
  const preTotal =
    slides.find(s => s.quizId === "pre")?.questions.length || 0;

  const postTotal =
    slides.find(s => s.quizId === "post")?.questions.length || 0;

  const postPassed =
    scores.post !== null && scores.post >= Math.ceil(postTotal / 2);

  const gainDisplay =
    scores.pre !== null && scores.post !== null
      ? Math.max(
          0,
          Math.round(((scores.post - scores.pre) / postTotal) * 100)
        )
      : 0;
  const postTestFinished = postPassed;

  const isCorrectAnswer = (question, userAnswer) => {
  if (!userAnswer) return false;

  if (question.type === "fill") {
    return (
      userAnswer.trim().toLowerCase() ===
      String(question.answer).trim().toLowerCase()
    );
  }

  return userAnswer === question.answer;
};

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-[#1a2332] text-white">
      <main className="max-w-4xl mx-auto mt-10 p-6">

        <h1 className="text-3xl font-bold mb-4">{lessonFullTitle}</h1>

        <div className="bg-[#151b2b] p-6 rounded-xl border border-gray-700 min-h-[420px] flex flex-col justify-between">

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">{slide.title}</h2>

              {/* IMAGE */}
              {slide.src && !slide.code && !slide.video && (
                <>
                  <img
                    src={slide.src}
                    alt=""
                    className="mx-auto rounded-lg  max-h-[420px]"
                  />
                  {slide.content && (
                    <p className="text-center mt-3 text-gray-300 whitespace-pre-line">
                      {slide.content}
                    </p>
                  )}
                </>
              )}

              {/* CODE */}
              {slide.code && (
                <div className="bg-[#1f2937] rounded-xl border border-gray-700 p-4">
                  <pre className="font-mono bg-black p-4 rounded-lg overflow-x-auto">
                    {slide.content}
                  </pre>

                  <button
                    onClick={runCode}
                    disabled={isRunning}
                    className="mt-4 px-5 py-2 bg-green-500 text-black rounded-lg font-bold"
                  >
                    <Play size={16} className="inline mr-2" />
                    Run Code
                  </button>

                  {output && (
                    <div className="mt-3 text-green-400 font-mono">
                      &gt; {output}
                    </div>
                  )}
                </div>
              )}

              {/* QUIZ */}
              {isQuiz && slide.questions.map((q, qi) => (
<div
  className={`p-4 rounded-lg border transition-colors
    ${
      quizLocked[quizId]
        ? isCorrectAnswer(q, answers[qi])
          ? "border-green-500 bg-green-500/10"
          : "border-red-500 bg-red-500/10"
        : quizErrors[qi]
        ? "border-red-500 bg-red-500/10"
        : "border-gray-700 bg-[#1f2937]"
    }
  `}
>

                  <p className="font-bold mb-3">
                    {qi + 1}. {q.question}
                  </p>

                  {q.type === "choice" && q.choices.map((c, ci) => (
                    <button
                      key={ci}
                      disabled={isLocked}
                      onClick={() =>
                        setAnswersByQuiz(prev => ({
                          ...prev,
                          [quizId]: { ...prev[quizId], [qi]: c }
                        }))
                      }
                      className={`block w-full text-left px-4 py-2 rounded-lg mb-2 ${
                        answers[qi] === c
                          ? "bg-blue-500 text-black"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      {c}
                    </button>
                  ))}

                  {q.type === "fill" && (
                    <input
                      disabled={isLocked}
                      value={answers[qi] || ""}
                      onChange={e =>
                        setAnswersByQuiz(prev => ({
                          ...prev,
                          [quizId]: { ...prev[quizId], [qi]: e.target.value }
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600"
                      placeholder="พิมพ์คำตอบ..."
                    />
                  )}
                  {/*ไม่ได้ใช้*/}
                  {isLocked && (
                    <p className="mt-2 text-sm text-green-400">
                      {/* คำตอบที่ถูก: {q.answer} */}
                    </p>
                  )}
                  {quizErrors[qi] && (
                    <p className="text-red-400 text-sm mt-2">
                      ❗ กรุณาตอบข้อนี้
                    </p>
                  )}
                  {quizLocked[quizId] && (
  <p
    className={`mt-2 font-bold ${
      isCorrectAnswer(q, answers[qi])
        ? "text-green-400"
        : "text-red-400"
    }`}
  >
    {isCorrectAnswer(q, answers[qi])
      ? <p>✅ ตอบถูก</p>
      : <p>❌ ตอบผิด คำตอบที่ถูก: {q.answer}</p>}
  </p>
)}

                </div>
              ))}

              {isQuiz && (
                <button
                  onClick={submitQuiz}
                  disabled={isLocked}
                  className={`w-full py-3 rounded-lg font-bold ${
                    isLocked
                      ? "bg-gray-600"
                      : "bg-green-500 hover:bg-green-400 text-black"
                  }`}
                >
                  {isLocked
                    ? `คะแนน ${scores[quizId]} / ${slide.questions.length}`
                    : "ส่งคำตอบ"}
                </button>
              )}

            </motion.div>
          </AnimatePresence>

          {/* CONTROLS */}
          <div className="flex justify-between mt-6">
            {hasPrev ? (
              <button
                onClick={() => setCurrentSlide(p => p - 1)}
                className="p-2 bg-blue-500 rounded-lg"
              >
                <ChevronLeft />
              </button>
            ) : <div />}

            {hasNext ? (
              <button
                onClick={() => canGoNext() && setCurrentSlide(p => p + 1)}
                disabled={!canGoNext()}
                className={`p-2 rounded-lg ${
                  canGoNext() ? "bg-blue-500" : "bg-gray-600"
                }`}
              >
                <ChevronRight />
              </button>
            ) : <div />}
          </div>
        </div>
                {/* ===== FOOTER (ใช้แค่นี้) ===== */}
        <div className="mt-12 flex justify-between items-center border-t border-gray-700 pt-6">
          <button
            onClick={() => onNavigate("learn")}
            className="px-6 py-3 bg-gray-700 rounded-lg"
          >
            Back
          </button>

          <button
            onClick={() => onNavigate("exercise")}
            disabled={!postTestFinished}
            className={`px-8 py-3 rounded-lg font-bold
              ${
                postTestFinished
                  ? "bg-green-500 text-black"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
          >
            Start Exercise
          </button>
        </div>
      </main>
      
      {/* SUMMARY MODAL */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#151b2b] p-8 rounded-xl border border-gray-700 w-full max-w-md text-center space-y-4">

            <h2 className="text-2xl font-bold text-green-400">
              สรุปผลการเรียน
            </h2>

            <p>
              คะแนนหลังเรียน:
              <span className="font-bold text-green-400">
                {" "}{scores.post} / {postTotal}
              </span>
            </p>

            <p className={`text-xl font-bold ${postPassed ? "text-green-400" : "text-red-400"}`}>
              {postPassed
                ? "✅ ผ่าน (ได้มากกว่าครึ่ง)"
                : "❌ ไม่ผ่าน (ต้องได้อย่างน้อย 50%)"}
            </p>

            <p>
              คะแนนก่อนเรียน:
              <span className="font-bold text-blue-400">
                {" "}{scores.pre} / {preTotal}
              </span>
            </p>

            <p className="text-yellow-300 font-bold">
              ระดับพัฒนาการ: {gainDisplay}%
            </p>

<div className="flex gap-4 justify-center pt-4">

  {postPassed && (
    <>
      <button
        onClick={() => onNavigate("exercise")}
        className="
          px-5 py-2
          bg-green-500 hover:bg-green-400
          text-black
          rounded-lg
          font-bold
        "
      >
        🎉 ผ่านบทเรียน ไปทำแบบฝึกหัด
      </button>

      <button
        onClick={() => setShowSummary(false)}
        className="
          px-5 py-2
          bg-gray-600 hover:bg-gray-500
          rounded-lg
          font-bold
        "
      >
        ปิด
      </button>
    </>
  )}

  {!postPassed && (
    <button
      onClick={() => {
        setShowSummary(false);
        setQuizLocked(prev => ({ ...prev, post: false }));
        setAnswersByQuiz(prev => ({ ...prev, post: {} }));
        setScores(prev => ({ ...prev, post: null }));
        setCurrentSlide(1);
      }}
      className="
        px-5 py-2
        bg-red-500 hover:bg-red-400
        text-black
        rounded-lg
        font-bold
      "
    >
      ❌ ไม่ผ่าน กลับไปเรียนใหม่
    </button>
  )}

</div>


          </div>
        </div>
      )}
    </div>
  );
}
