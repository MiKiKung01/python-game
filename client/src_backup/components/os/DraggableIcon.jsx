import { useState, useEffect, useRef } from 'react';

export default function DraggableIcon({ id, icon, label, initialPos, onOpen, onContextMenu, draggable, dragData, onFileDrop, isDropTarget, dropHighlightColor }) {
    const [pos, setPos] = useState(initialPos || { x: 10, y: 10 });
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isOverDrop, setIsOverDrop] = useState(false);
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
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    dragMoved.current = true;
                }
                setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, offset]);

    // HTML5 Drag (for file transfer)
    const handleDragStart = (e) => {
        if (dragData) {
            e.dataTransfer.setData('application/json', JSON.stringify(dragData));
            e.dataTransfer.effectAllowed = 'move';
        }
    };

    // Drop target handling
    const handleDragOver = (e) => {
        if (!isDropTarget) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsOverDrop(true);
    };

    const handleDragLeave = () => {
        setIsOverDrop(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsOverDrop(false);
        if (!onFileDrop) return;
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            onFileDrop(data);
        } catch (err) {
            console.error('Drop parse error', err);
        }
    };

    return (
        <div
            style={{ top: pos.y, left: pos.x }}
            className={`absolute flex flex-col items-center gap-1 p-2 rounded cursor-pointer w-24 z-0 transition-all
                ${isDragging ? 'opacity-60 scale-95 cursor-grabbing' : 'hover:bg-white/10'}
                ${isOverDrop ? `ring-2 ${dropHighlightColor || 'ring-blue-400'} bg-blue-500/20 scale-110` : ''}`}
            onMouseDown={handleMouseDown}
            onDoubleClick={(e) => {
                if (!dragMoved.current) onOpen?.();
            }}
            onContextMenu={(e) => onContextMenu?.(e, id)}
            // HTML5 drag source
            draggable={!!dragData}
            onDragStart={handleDragStart}
            // HTML5 drop target
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`p-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg text-white pointer-events-none
                ${isOverDrop ? 'scale-110 shadow-2xl' : ''} transition-transform`}>
                {icon}
            </div>
            <span className="text-white text-xs font-medium drop-shadow-md text-center leading-tight bg-black/50 px-1 rounded pointer-events-none select-none">
                {label}
            </span>
        </div>
    );
}