import { useState, useRef, useEffect } from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';

export default function Window({ id, title, children, onClose, onMinimize, isActive, onFocus }) {
    const [isMaximized, setIsMaximized] = useState(false);
    const [size, setSize] = useState({ w: 800, h: 600 });
    const [position, setPosition] = useState({ x: 50 + (Math.random() * 50), y: 50 + (Math.random() * 50) });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

    const handleMouseDown = (e) => {
        if (isMaximized) return;
        onFocus();
        setIsDragging(true);
        setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
            if (isResizing) setSize({ w: Math.max(300, e.clientX - position.x), h: Math.max(200, e.clientY - position.y) });
        };
        const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isDragging, isResizing, dragOffset]);

    return (
        <div onMouseDown={onFocus}
            style={{
                top: isMaximized ? 0 : position.y,
                left: isMaximized ? 0 : position.x,
                width: isMaximized ? '100vw' : size.w,
                height: isMaximized ? 'calc(100vh - 48px)' : size.h,
                zIndex: isActive ? 50 : 10,
                transition: isDragging || isResizing ? 'none' : 'all 0.15s ease-out',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'scale(1)' : 'scale(0.95)',
                background: 'var(--t-window-bg)',
            }}
            className={`fixed flex flex-col overflow-hidden pointer-events-auto
                ${isMaximized ? 'rounded-none' : 'rounded-xl'}
                ${isActive ? 'shadow-[0_8px_40px_rgba(0,0,0,0.3)]' : 'shadow-[0_4px_20px_rgba(0,0,0,0.2)]'}
                border border-t-border`}>

            {/* Title Bar */}
            <div onMouseDown={handleMouseDown}
                className="h-9 flex justify-between items-center px-3 select-none cursor-default border-b border-t-border"
                style={{ background: isActive ? 'var(--t-window-titlebar)' : 'var(--t-window-titlebar-inactive)' }}>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-40">🐾</span>
                    <span className={`text-xs font-medium ${isActive ? 'text-t-text' : 'text-t-muted'}`}>{title}</span>
                </div>
                <div className="flex gap-1.5 h-full items-center z-20" onMouseDown={e => e.stopPropagation()}>
                    <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-yellow-500/70 hover:bg-yellow-400 transition-colors flex items-center justify-center group">
                        <Minus size={8} className="text-yellow-900 opacity-0 group-hover:opacity-100" />
                    </button>
                    <button onClick={() => setIsMaximized(!isMaximized)} className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-400 transition-colors flex items-center justify-center group">
                        {isMaximized ? <Square size={6} className="text-green-900 opacity-0 group-hover:opacity-100" /> : <Maximize2 size={6} className="text-green-900 opacity-0 group-hover:opacity-100" />}
                    </button>
                    <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-400 transition-colors flex items-center justify-center group">
                        <X size={8} className="text-red-900 opacity-0 group-hover:opacity-100" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative" style={{ background: 'var(--t-window-bg)' }}>{children}</div>

            {/* Resize Handle */}
            {!isMaximized && (
                <div onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); }}
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20" />
            )}
        </div>
    );
}