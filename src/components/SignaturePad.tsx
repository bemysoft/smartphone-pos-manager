import React, { useRef, useState, useEffect } from "react";
import { RotateCcw, Check, Edit3 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string) => void;
  width?: number;
  height?: number;
  placeholder?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  width = 400,
  height = 140,
  placeholder = "Tanda tangan di sini menggunakan jari atau mouse"
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set line styles
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1E293B"; // Dark slate stroke
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL("image/png");
      onSignatureChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange("");
  };

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-inner">
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-600 text-xs gap-1.5 select-none p-4 text-center">
            <Edit3 className="h-4 w-4 shrink-0" />
            <span>{placeholder}</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-32 touch-none cursor-crosshair block"
        />
        {hasSignature && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full text-[10px]">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[11px]">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {hasSignature ? "✓ Tanda tangan tersimpan" : "Gunakan touchscreen / mouse"}
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          Bersihkan
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
