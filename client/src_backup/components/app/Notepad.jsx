import { useState, useRef, useEffect } from 'react';
import { Save, X, FileText, AlignLeft } from 'lucide-react';

export default function Notepad({ fileId, fileName, content, onSave }) {
  const [text, setText] = useState(content || '');
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(content || '');
    setHasChanges(false);
  }, [fileId, content]);

  const handleChange = (val) => {
    setText(val);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(fileId, text);
    setHasChanges(false);
  };

  // Auto-focus
  useEffect(() => {
    textareaRef.current?.focus();
  }, [fileId]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [text, fileId]);

  const lineCount = text.split('\n').length;
  const charCount = text.length;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Menu bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-2 py-1 flex items-center gap-1">
        <button 
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all
            ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-500' : 'text-slate-400 bg-slate-50 cursor-default'}`}
        >
          <Save size={13} /> Save
        </button>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
          <FileText size={12} />
          <span>{fileName || 'Untitled'}</span>
          {hasChanges && <span className="text-orange-500 font-bold">● Modified</span>}
        </div>
      </div>

      {/* Text area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line numbers */}
        <div className="bg-slate-50 border-r border-slate-200 px-2 py-3 text-right text-[11px] text-slate-300 font-mono select-none overflow-hidden leading-[1.625rem]">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 p-3 outline-none resize-none font-mono text-sm text-slate-800 leading-[1.625rem] bg-white"
          spellCheck={false}
          placeholder="Start typing..."
        />
      </div>

      {/* Status bar */}
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-1 flex justify-between text-[11px] text-slate-400">
        <div className="flex gap-4">
          <span>Lines: {lineCount}</span>
          <span>Characters: {charCount}</span>
        </div>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
