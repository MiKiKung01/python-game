import { useState, useEffect, useRef } from 'react';

export default function DraggableIcon({ id, icon, label, initialPos, onOpen, onContextMenu, draggable, dragData, onFileDrop, isDropTarget, dropHighlightColor }) {
    const [pos, setPos] = useState(initialPos || { x: 10, y: 10 });
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isOverDrop, setIsOverDrop] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const dragMoved = useRef(false);
    const mouseDownPos = useRef(null);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        dragMoved.current = false;
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                const dx = e.clientX - (mouseDownPos.current?.x || 0);
                const dy = e.clientY - (mouseDownPos.current?.y || 0);
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true;
                setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
            }
        };
        const handleMouseUp = () => setIsDragging(false);
        if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isDragging, offset]);

    const handleDragStart = (e) => { if (dragData) { e.dataTransfer.setData('application/json', JSON.stringify(dragData)); e.dataTransfer.effectAllowed = 'move'; } };
    const handleDragOver = (e) => { if (!isDropTarget) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsOverDrop(true); };
    const handleDragLeave = () => setIsOverDrop(false);
    const handleDrop = (e) => {
        e.preventDefault(); setIsOverDrop(false);
        if (!onFileDrop) return;
        try { onFileDrop(JSON.parse(e.dataTransfer.getData('application/json'))); } catch (err) { console.error('Drop parse error', err); }
    };

    return (
        <div style={{ top: pos.y, left: pos.x }}
            className={`absolute flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer w-[76px] z-0 transition-all duration-200
                ${isDragging ? 'opacity-50 scale-90 cursor-grabbing' : ''}
                ${isHovered && !isDragging ? 'bg-t-icon-bg-hover' : ''}
                ${isOverDrop ? `ring-2 ${dropHighlightColor || 'ring-t-accent'} bg-t-accent-soft scale-110` : ''}`}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={() => { if (!dragMoved.current) onOpen?.(); }}
            onContextMenu={(e) => onContextMenu?.(e, id)}
            draggable={!!dragData} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className={`p-2.5 rounded-xl text-t-text pointer-events-none transition-all duration-300
                bg-t-icon-bg border border-t-icon-border backdrop-blur-sm
                ${isHovered ? 'bg-t-icon-bg-hover shadow-[0_0_15px_var(--t-glow)] border-t-border-accent scale-110' : ''}
                ${isOverDrop ? 'scale-110 shadow-[0_0_20px_var(--t-glow)]' : ''}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-medium text-center leading-tight px-1 rounded select-none pointer-events-none transition-all duration-200
                ${isHovered ? 'text-t-text bg-t-card' : 'text-t-text-soft bg-t-card/60'}`}
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                {label}
            </span>
        </div>
    );
}