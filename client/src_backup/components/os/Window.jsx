import { useState, useRef, useEffect } from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';



export default function Window({ id, title, children, onClose, onMinimize, isActive, onFocus }) {
    const [isMaximized, setIsMaximized] = useState(false);
    const [size, setSize] = useState({ w: 800, h: 600 });
    const [position, setPosition] = useState({ x: 50 + (Math.random() * 50), y: 50 + (Math.random() * 50) });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // --- Dragging Logic ---
    const handleMouseDown = (e) => {
        if (isMaximized) return;
        onFocus(); // Bring to front
        setIsDragging(true);
        setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
            }
            if (isResizing) {
                setSize({
                    w: Math.max(300, e.clientX - position.x),
                    h: Math.max(200, e.clientY - position.y)
                });
            }
        };
        const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset]);

    const toggleMaximize = () => setIsMaximized(!isMaximized);

    return (
        <div
            onMouseDown={onFocus}
            style={{
                top: isMaximized ? 0 : position.y,
                left: isMaximized ? 0 : position.x,
                width: isMaximized ? '100vw' : size.w,
                height: isMaximized ? '100vh' : size.h,
                zIndex: isActive ? 50 : 10,
                transition: isDragging || isResizing ? 'none' : 'all 0.1s ease-out'
            }}
            className={`fixed bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl flex flex-col overflow-hidden pointer-events-auto ${isMaximized ? 'rounded-none border-none' : ''}`}
        >
            {/* Title Bar */}
            <div onMouseDown={handleMouseDown} className="bg-[#2d2d2d] h-9 flex justify-between items-center px-3 select-none border-b border-[#1e1e1e] cursor-default">
                <span className="text-xs text-gray-300 font-sans">{title}</span>
                <div className="flex gap-2 h-full items-center z-20" onMouseDown={e => e.stopPropagation()}>
                    <button onClick={onMinimize} className="p-1 hover:bg-white/10 rounded text-gray-400"><Minus size={14} /></button>
                    <button onClick={toggleMaximize} className="p-1 hover:bg-white/10 rounded text-gray-400">
                        {isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-red-600 hover:text-white rounded text-gray-400 transition-colors"><X size={14} /></button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
                {children}
            </div>

            {/* Resize Handle (มุมขวาล่าง) */}
            {!isMaximized && (
                <div
                    onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); }}
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 hover:bg-blue-500/50"
                />
            )}
        </div>
    );
}