
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface CanvasProps {
  color: string;
  width: number;
  tool: 'brush' | 'eraser' | 'neon';
}

const Canvas = forwardRef(({ color, width, tool }: CanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas to window size
    const resize = () => {
      const tempImage = canvas.toDataURL();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        contextRef.current = ctx;
        
        // Restore contents
        const img = new Image();
        img.src = tempImage;
        img.onload = () => ctx.drawImage(img, 0, 0);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    return () => window.removeEventListener('resize', resize);
  }, []);

  useImperativeHandle(ref, () => ({
    getCanvasData: () => {
      return canvasRef.current?.toDataURL('image/png') || '';
    },
    clear: () => {
      const ctx = contextRef.current;
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }));

  const startDrawing = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    let x, y;
    if ('touches' in nativeEvent) {
      x = nativeEvent.touches[0].clientX;
      y = nativeEvent.touches[0].clientY;
    } else {
      x = (nativeEvent as MouseEvent).clientX;
      y = (nativeEvent as MouseEvent).clientY;
    }

    const ctx = contextRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      // Setup styles based on tool
      if (tool === 'neon') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      setIsDrawing(true);
    }
  };

  const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    let x, y;
    if ('touches' in nativeEvent) {
      x = nativeEvent.touches[0].clientX;
      y = nativeEvent.touches[0].clientY;
    } else {
      x = (nativeEvent as MouseEvent).clientX;
      y = (nativeEvent as MouseEvent).clientY;
    }

    const ctx = contextRef.current;
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    const ctx = contextRef.current;
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      className="block w-full h-full bg-transparent"
    />
  );
});

export default Canvas;
