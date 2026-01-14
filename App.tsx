
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Trash2, 
  Download, 
  Cpu, 
  Palette, 
  Zap, 
  Brush, 
  Eraser, 
  X,
  ChevronRight,
  Wind
} from 'lucide-react';
import Canvas from './components/Canvas';
import { analyzeSketch, generateVision } from './services/gemini';
import { AIResponse, AppState } from './types';

const App: React.FC = () => {
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushWidth, setBrushWidth] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'neon'>('brush');
  const [appState, setAppState] = useState<AppState>('drawing');
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const canvasRef = useRef<{ getCanvasData: () => string; clear: () => void } | null>(null);

  const handleClear = () => {
    if (window.confirm('Clear your cosmic creation?')) {
      canvasRef.current?.clear();
    }
  };

  const handleAIAnalyze = async () => {
    if (!canvasRef.current) return;
    setAppState('analyzing');
    try {
      const data = canvasRef.current.getCanvasData();
      const result = await analyzeSketch(data, "Focus on the creativity and lines.");
      setAiData(result);
      
      // Also generate a "vision" based on the backstory
      const vision = await generateVision(result.backstory);
      setGeneratedImg(vision);
      setAppState('viewing-result');
    } catch (err) {
      console.error(err);
      alert("The stars are misaligned. Please try again.");
      setAppState('drawing');
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'nebula-sketch.png';
    link.href = canvasRef.current.getCanvasData();
    link.click();
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden text-white font-inter">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%', scale: Math.random() }}
            animate={{ 
              y: [null, '-20%', '120%'],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ width: '2px', height: '2px' }}
          />
        ))}
      </div>

      {/* Main Drawing Area */}
      <main className="w-full h-full cursor-crosshair">
        <Canvas 
          ref={canvasRef}
          color={tool === 'eraser' ? '#050505' : brushColor} 
          width={brushWidth}
          tool={tool}
        />
      </main>

      {/* Floating Toolbar (Vercel Style) */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-full flex items-center gap-6 shadow-2xl z-40"
      >
        <div className="flex items-center gap-2 pr-6 border-r border-white/10">
          <ToolbarButton 
            active={tool === 'brush'} 
            onClick={() => setTool('brush')} 
            icon={<Brush size={20} />} 
            label="Brush"
          />
          <ToolbarButton 
            active={tool === 'neon'} 
            onClick={() => setTool('neon')} 
            icon={<Zap size={20} />} 
            label="Neon"
          />
          <ToolbarButton 
            active={tool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            icon={<Eraser size={20} />} 
            label="Eraser"
          />
        </div>

        <div className="flex items-center gap-4">
          <input 
            type="color" 
            value={brushColor} 
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-10 h-10 rounded-full bg-transparent border-none cursor-pointer overflow-hidden"
          />
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={brushWidth} 
            onChange={(e) => setBrushWidth(parseInt(e.target.value))}
            className="w-32 accent-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 pl-6 border-l border-white/10">
          <button onClick={handleClear} className="p-3 hover:bg-red-500/20 rounded-full transition-colors text-red-400">
            <Trash2 size={20} />
          </button>
          <button onClick={handleDownload} className="p-3 hover:bg-white/10 rounded-full transition-colors">
            <Download size={20} />
          </button>
          <button 
            onClick={handleAIAnalyze}
            className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
          >
            <Cpu size={18} />
            Summon AI
          </button>
        </div>
      </motion.div>

      {/* App Header */}
      <header className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none z-30">
        <div className="pointer-events-auto">
          <h1 className="text-3xl font-orbitron font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
            NEBULA SKETCH
          </h1>
          <p className="text-white/40 text-xs mt-1 uppercase tracking-tighter">Your AI-Powered Cosmic Studio</p>
        </div>
      </header>

      {/* AI Analyzing Modal */}
      <AnimatePresence>
        {appState === 'analyzing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#050505]/90 flex flex-col items-center justify-center backdrop-blur-md"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-48 h-48 rounded-full border-t-4 border-l-4 border-purple-500 flex items-center justify-center"
              >
                <div className="w-40 h-40 rounded-full border-b-4 border-r-4 border-blue-500 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-t-4 border-emerald-500 flex items-center justify-center">
                    <Sparkles className="text-white w-12 h-12" />
                  </div>
                </div>
              </motion.div>
              <motion.div 
                className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h2 className="text-2xl font-orbitron mt-12 animate-pulse">Consulting the Cosmic Muse...</h2>
            <p className="text-white/40 mt-4 text-center max-w-md">Gemini is decoding your brushstrokes and weaving a vision of the infinite.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Result Side Drawer */}
      <AnimatePresence>
        {appState === 'viewing-result' && aiData && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 w-[450px] h-full glass z-50 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
          >
            <div className="p-8 flex justify-between items-center border-b border-white/10">
              <h3 className="text-xl font-orbitron font-bold flex items-center gap-2">
                <Sparkles className="text-yellow-400" />
                THE VISION
              </h3>
              <button onClick={() => setAppState('drawing')} className="p-2 hover:bg-white/10 rounded-full">
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Generated Image */}
              {generatedImg && (
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Wind size={12} /> Realized Essence
                  </h4>
                  <div className="relative group rounded-2xl overflow-hidden border border-white/20">
                    <img src={generatedImg} alt="AI Vision" className="w-full h-auto" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                      <p className="text-sm italic text-white/80">{aiData.backstory}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Critique */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest text-white/40 flex items-center gap-2">
                   <ChevronRight size={12} /> Muse's Critique
                </h4>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10">
                  <p className="text-lg leading-relaxed font-light">{aiData.critique}</p>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest text-white/40 flex items-center gap-2">
                   <ChevronRight size={12} /> Divine Prompt
                </h4>
                <p className="text-white/60 text-sm">{aiData.suggestion}</p>
              </div>

              {/* Palette */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest text-white/40 flex items-center gap-2">
                   <Palette size={12} /> Suggested Palette
                </h4>
                <div className="flex gap-4">
                  {aiData.palette.map((color, idx) => (
                    <motion.button 
                      key={idx}
                      whileHover={{ y: -5 }}
                      onClick={() => setBrushColor(color)}
                      className="w-full h-12 rounded-xl border border-white/20 shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-white/40 text-center">Click a color to manifest it in your brush</p>
              </div>
            </div>

            <div className="p-8 border-t border-white/10">
              <button 
                onClick={() => setAppState('drawing')}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                RETURN TO CANVAS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolbarButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string 
}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
      active ? 'bg-white text-black' : 'hover:bg-white/10 text-white/60'
    }`}
  >
    {icon}
    <span className="text-sm font-semibold">{label}</span>
  </button>
);

export default App;
