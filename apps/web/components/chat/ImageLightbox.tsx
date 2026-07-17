"use client";

import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const STEP = 0.5;

// Fullscreen image preview with zoom (buttons / wheel / double-click / keyboard) and drag-to-pan when zoomed in.
export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);

  const clamp = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

  const zoomBy = useCallback((delta: number) => {
    setScale((prev) => {
      const next = clamp(prev + delta);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Keyboard shortcuts + lock background scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomBy(STEP);
      else if (e.key === "-" || e.key === "_") zoomBy(-STEP);
      else if (e.key === "0") reset();
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, zoomBy, reset]);

  function handleWheel(e: React.WheelEvent) {
    zoomBy(e.deltaY < 0 ? STEP : -STEP);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLImageElement>) {
    if (scale <= MIN_SCALE) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, originX: offset.x, originY: offset.y };
    setIsDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLImageElement>) {
    if (!dragStart.current) return;
    setOffset({
      x: dragStart.current.originX + (e.clientX - dragStart.current.x),
      y: dragStart.current.originY + (e.clientY - dragStart.current.y)
    });
  }

  function endDrag() {
    dragStart.current = null;
    setIsDragging(false);
  }

  const canReset = scale !== 1 || offset.x !== 0 || offset.y !== 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh"
    >
      {/* Toolbar */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => zoomBy(-STEP)}
          disabled={scale <= MIN_SCALE}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-800/80 text-stone-200 transition-colors hover:bg-stone-700 disabled:opacity-40"
          title="Thu nhỏ (-)"
        >
          <Minus size={16} />
        </button>
        <span className="min-w-[3.25rem] select-none text-center text-xs font-medium text-stone-200">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(STEP)}
          disabled={scale >= MAX_SCALE}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-800/80 text-stone-200 transition-colors hover:bg-stone-700 disabled:opacity-40"
          title="Phóng to (+)"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={!canReset}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-800/80 text-stone-200 transition-colors hover:bg-stone-700 disabled:opacity-40"
          title="Đặt lại (0)"
        >
          <RotateCcw size={15} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-800/80 text-stone-200 transition-colors hover:bg-rose-600 hover:text-white"
          title="Đóng (Esc)"
        >
          <X size={17} />
        </button>
      </div>

      {/* Image stage */}
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden p-6 md:p-12"
        onWheel={handleWheel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          draggable={false}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={() => (scale > MIN_SCALE ? reset() : zoomBy(1.5))}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: scale > MIN_SCALE ? (isDragging ? "grabbing" : "grab") : "zoom-in"
          }}
          className={`max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl ${
            isDragging ? "" : "transition-transform duration-100"
          }`}
        />
      </div>
    </div>
  );
}
