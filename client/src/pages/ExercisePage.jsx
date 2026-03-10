import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { RotateCcw, Play, CheckCircle2, Terminal } from "lucide-react";

export default function ExercisePage() {
  // --- State สำหรับโจทย์และโค้ด ---
  const [code, setCode] = useState(`# ใช้ f-string เพื่อจัดการทศนิยม 2 ตำแหน่ง
salary = int(input("Enter salary: "))
tax = salary * 0.07
print(f"Tax is {tax:.2f}")`);

  const [terminalLines, setTerminalLines] = useState([]);
  const [pyodide, setPyodide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [currentInput, setCurrentInput] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");

  const inputResolverRef = useRef(null);
  const terminalRef = useRef(null);

  const testCases = [
    { input: "10000", expected: "Tax is 700.0" },
    { input: "500", expected: "Tax is 35.0" },
    { input: "150000", expected: "Tax is 10500.0" }
  ];

  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .trim()
      .replace(/\r/g, "")
      .replace(/(\d+\.\d{5,})/g, (match) => {
        return parseFloat(parseFloat(match).toFixed(2)).toString();
      })
      .replace(/\s+/g, " ");
  };

  // Auto Scroll Terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  const appendLine = (text) => {
    setTerminalLines((prev) => [...prev, text]);
  };

  /* =========================
      INIT PYODIDE
  ========================== */
  useEffect(() => {
    const initPyodide = async () => {
      setIsLoading(true);
      try {
        const instance = await window.loadPyodide();
        
        // Setup Output Stream
        instance.setStdout({
          batched: (text) => { if (text.trim()) appendLine(text); }
        });
        instance.setStderr({
          batched: (text) => appendLine("❌ Error: " + text)
        });

        // ฟังก์ชันสำหรับกู้คืนโหมด Interactive (Run)
        const restoreBridge = `
import builtins
from js import requestInputFromJS
async def custom_input(prompt=""):
    return await requestInputFromJS(prompt)
builtins.input = custom_input
`;
        await instance.runPythonAsync(restoreBridge);
        
        setPyodide(instance);
        setIsLoading(false);
        appendLine("Python Ready 🐍");
      } catch (err) {
        appendLine("Failed to load Python: " + err.message);
      }
    };

    if (!window.loadPyodide) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
      script.onload = initPyodide;
      document.head.appendChild(script);
    } else {
      initPyodide();
    }

    // สร้าง Global Bridge สำหรับรับค่าจาก JS ไป Python
    window.requestInputFromJS = (promptText) => {
      setCurrentPrompt(promptText);
      return new Promise((resolve) => {
        inputResolverRef.current = resolve;
      });
    };
  }, []);

  /* =========================
      RUN MODE (Interactive)
  ========================== */
const handleRun = async () => {
  if (!pyodide || isRunning) return;
  setTerminalLines([]);
  setIsRunning(true);
  setIsSuccess(false);

  try {
    const processedCode = code.replace(/input\(/g, "await input(");
    
    // เพิ่มการ Reset Stream ไว้ใน wrappedCode เลย
    const wrappedCode = `
import asyncio
import sys, builtins
from js import requestInputFromJS

# --- RESET STREAMS ---
# คืนค่าท่อมาตรฐานก่อนเริ่มรันโค้ดผู้ใช้เสมอ
sys.stdout = sys.__stdout__
sys.stdin = sys.__stdin__

async def custom_input(prompt=""):
    return await requestInputFromJS(prompt)
builtins.input = custom_input
# ---------------------

async def __user_code__():
${processedCode.split("\n").map(l => "    " + l).join("\n")}

await __user_code__()
`;
    await pyodide.runPythonAsync(wrappedCode);
  } catch (err) {
    appendLine("Error: " + err.message);
  } finally {
    setIsRunning(false);
  }
};

  /* =========================
      SUBMIT MODE (Auto-Grading)
  ========================== */
  const handleSubmit = async () => {
    if (!pyodide || isRunning) return;
    setIsRunning(true);
    setTerminalLines(["--- Starting Auto-Grading ---"]);
    let allPassed = true;

    try {
      for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        const encodedCode = btoa(unescape(encodeURIComponent(code)));
        
        const gradingScript = `
import sys, builtins, base64
from io import StringIO

def sync_input(p=""): 
    return sys.stdin.readline().rstrip('\\n')

builtins.input = sync_input
sys.stdin = StringIO("${test.input}")
sys.stdout = StringIO()

try:
    # รันโค้ดในพื้นที่แยกส่วน (Clean Locals)
    exec(base64.b64decode("${encodedCode}").decode('utf-8'), {"input": sync_input, "__builtins__": builtins}, {})
    output = sys.stdout.getvalue()
except Exception as e: 
    output = str(e)

output.strip()
`;
        const rawResult = await pyodide.runPythonAsync(gradingScript);
        const actual = normalizeText(rawResult);
        const expected = normalizeText(test.expected);

        if (actual.includes(expected)) {
          appendLine(`✅ Test Case ${i + 1}: Passed`);
        } else {
          appendLine(`❌ Test Case ${i + 1}: Failed`);
          appendLine(`   Expected: "${expected}"`);
          appendLine(`   Got: "${actual}"`);
          allPassed = false;
          break; 
        }
      }
    } catch (err) {
      appendLine(`❌ System Error: ` + err.message);
      allPassed = false;
    } finally {
      // สำคัญมาก: ต้องคืนค่าระบบ Input กลับมาเป็นโหมด Async สำหรับปุ่ม Run
      await pyodide.runPythonAsync(`
import builtins
from js import requestInputFromJS
async def custom_input(prompt=""):
    return await requestInputFromJS(prompt)
builtins.input = custom_input
`);
      setIsRunning(false);
    }

    if (allPassed) {
      setIsSuccess(true);
      alert("🎉 ยอดเยี่ยม! ผ่านทุกกรณีทดสอบ");
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && inputResolverRef.current) {
      appendLine(currentPrompt + currentInput);
      inputResolverRef.current(currentInput);
      inputResolverRef.current = null;
      setCurrentInput("");
      setCurrentPrompt("");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-[#1e293b] border-b border-gray-700 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">2</div>
          <h2 className="font-bold text-lg">Python Learning Lab</h2>
        </div>
        {isLoading && <span className="text-yellow-400 text-sm animate-pulse">Loading Python Engine...</span>}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/3 bg-[#1e293b] border-r border-gray-700 p-6 overflow-y-auto text-sm">
          <h1 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
            <CheckCircle2 size={20} /> โจทย์: คำนวณภาษี
          </h1>
          <p className="text-gray-300 mb-4 leading-relaxed">
            จงเขียนโปรแกรมรับค่าเงินเดือน (Salary) จากผู้ใช้งาน 
            แล้วคำนวณภาษีมูลค่าเพิ่ม 7% ของเงินเดือนนั้น 
            จากนั้นแสดงผลลัพธ์ในรูปแบบ <code className="bg-gray-800 px-1 rounded text-orange-400 font-mono">Tax is [value]</code>
          </p>
          <div className="bg-black p-4 rounded border border-gray-600 font-mono text-xs mb-4 space-y-2">
            <p className="text-gray-500">// ตัวอย่างผลลัพธ์</p>
            <p>Input: 10000</p>
            <p className="text-green-400">Output: Tax is 700.0</p>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>* หมายเหตุ: ระบบจะปัดเศษทศนิยมที่เกินให้โดยอัตโนมัติ</p>
            <p>* ใช้ฟังก์ชัน input() และ print() ตามปกติ</p>
          </div>
        </aside>

        {/* Main Content (Editor & Terminal) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 border-b border-gray-700 relative">
            <Editor 
              height="100%" 
              defaultLanguage="python" 
              theme="vs-dark" 
              value={code} 
              onChange={(v) => setCode(v || "")} 
              options={{ fontSize: 16, minimap: { enabled: false }, padding: { top: 16 } }} 
            />
          </div>

          {/* Terminal Section */}
          <div className="h-1/3 flex flex-col bg-black relative">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-900/50">
              <Terminal size={14} className="text-gray-400" />
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Terminal</span>
            </div>
            
            <div ref={terminalRef} className="flex-1 p-4 font-mono text-sm overflow-y-auto">
              {terminalLines.map((line, i) => (
                <div key={i} className={`mb-1 ${line.startsWith('✅') ? 'text-green-400' : line.startsWith('❌') ? 'text-red-400' : 'text-gray-300'}`}>
                  {line}
                </div>
              ))}
              
              {/* Input Prompt Overlay */}
              {inputResolverRef.current && (
                <div className="flex items-center text-blue-400">
                  <span>{currentPrompt} &gt; </span>
                  <input 
                    autoFocus 
                    className="bg-transparent outline-none flex-1 text-white ml-2" 
                    value={currentInput} 
                    onChange={(e) => setCurrentInput(e.target.value)} 
                    onKeyDown={handleInputKeyDown} 
                  />
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="h-14 bg-[#1e293b] border-t border-gray-700 flex items-center justify-between px-4 shrink-0">
              <div className="flex space-x-2">
                <button 
                  onClick={handleRun} 
                  disabled={isRunning || isLoading} 
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <Play size={14}/> Run
                </button>
                <button 
                  onClick={() => setTerminalLines([])} 
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
                >
                  <RotateCcw size={14}/>
                </button>
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={isRunning || isLoading} 
                className={`px-6 py-1.5 rounded font-bold transition-all ${isSuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {isSuccess ? "Passed!" : "Submit Code"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}