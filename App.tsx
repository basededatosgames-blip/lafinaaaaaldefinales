
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Trash2, Download, Cpu, Palette, Zap, Brush, 
  Eraser, X, ChevronRight, Wind, Key, Wand2, Info
} from 'lucide-react';
import Canvas from './components/Canvas';
import { analyzeSketch, generateProVision } from './services/gemini';
import { AIResponse, AppState } from './types';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushWidth, setBrushWidth] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'neon'>('brush');
  const [appState, setAppState] = useState<AppState>('drawing');
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [isKeySetup, setIsKeySetup] = useState(false);
  
  const canvasRef = useRef<{ getCanvasData: () => string; clear: () => void } | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySetup(hasKey);
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    await window.aistudio.openSelectKey();
    setIsKeySetup(true);
  };

  const handleClear = () => {
    if (window.confirm('¿Limpiar tu creación cósmica?')) {
      canvasRef.current?.clear();
    }
  };

  const handleAIAnalyze = async (mode: 'basic' | 'pro') => {
    if (!canvasRef.current) return;
    
    if (mode === 'pro' && !isKeySetup) {
      await handleOpenKeyDialog();
      return;
    }

    setAppState('analyzing');
    try {
      const canvasData = canvasRef.current.getCanvasData();
      const analysis = await analyzeSketch(canvasData, "Enfócate en la composición.");
      setAiData(analysis);
      
      if (mode === 'pro') {
        const vision = await generateProVision(analysis.backstory, canvasData);
        setGeneratedImg(vision);
      } else {
        setGeneratedImg(null);
      }
      
      setAppState('viewing-result');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setIsKeySetup(false);
        alert("Tu API Key parece ser inválida. Por favor, selecciona una de un proyecto con facturación activa.");
      } else {
        alert("Las estrellas no están alineadas. Intenta de nuevo.");
      }
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
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            initial={{ x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%`, opacity: Math.random() }}
            animate={{ opacity: [0.1, 0.5, 0.1], scale: [1, 1.5, 1] }}
            transition={{ duration: Math.random() * 5 + 3, repeat: Infinity }}
            style={{ width: '1px', height: '1px' }}
          />
        ))}
      </div>

      <main className="w-full h-full cursor-crosshair">
        <Canvas 
          ref={canvasRef}
          color={tool === 'eraser' ? '#050505' : brushColor} 
          width={brushWidth}
          tool={tool}
        />
      </main>

      {/* Toolbar */}
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-3xl flex items-center gap-6 shadow-2xl z-40 max-w-[95vw] overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center gap-1 pr-4 border-r border-white/10 shrink-0">
          <ToolbarButton active={tool === 'brush'} onClick={() => setTool('brush')} icon={<Brush size={18} />} />
          <ToolbarButton active={tool === 'neon'} onClick={() => setTool('neon')} icon={<Zap size={18} />} />
          <ToolbarButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={18} />} />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer" />
          <input type="range" min="1" max="50" value={brushWidth} onChange={(e) => setBrushWidth(parseInt(e.target.value))} className="w-24 accent-purple-500" />
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-white/10 shrink-0">
          <button onClick={handleClear} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 size={18} /></button>
          <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg"><Download size={18} /></button>
          
          <div className="flex gap-2 ml-2">
            <button 
              onClick={() => handleAIAnalyze('basic')}
              className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border border-white/10"
            >
              <Cpu size={16} /> Analizar
            </button>
            <button 
              onClick={() => handleAIAnalyze('pro')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all"
            >
              <Wand2 size={16} /> Remix IA
            </button>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-orbitron font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            NEBULA SKETCH
          </h1>
        </div>
        {!isKeySetup && (
          <button 
            onClick={handleOpenKeyDialog}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold"
          >
            <Key size={14} /> CONFIGURAR API KEY (PRO)
          </button>
        )}
      </header>

      {/* Modals & Panels */}
      <AnimatePresence>
        {appState === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-[#050505]/95 flex flex-col items-center justify-center backdrop-blur-xl">
             <div className="relative w-32 h-32">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-b-2 border-purple-500" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-t-2 border-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-white w-8 h-8 animate-pulse" />
                </div>
             </div>
             <h2 className="text-xl font-orbitron mt-8 tracking-widest text-white/80">CANALIZANDO CREATIVIDAD...</h2>
          </motion.div>
        )}

        {appState === 'viewing-result' && aiData && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute top-0 right-0 w-full sm:w-[480px] h-full glass z-50 shadow-2xl flex flex-col">
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <h3 className="font-orbitron font-bold flex items-center gap-2 text-purple-400">
                <Sparkles size={20} /> RESULTADO AI
              </h3>
              <button onClick={() => setAppState('drawing')} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
              {generatedImg ? (
                <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative group">
                  <img src={generatedImg} alt="AI Remix" className="w-full aspect-square object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-black/60 backdrop-blur-sm">
                    <p className="text-sm italic text-white/90">"{aiData.backstory}"</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
                   <Info className="text-blue-400 shrink-0" size={18} />
                   <p className="text-xs text-blue-200">Usa "Remix IA" para ver una versión realista de tu dibujo (Requiere API Key de pago).</p>
                </div>
              )}

              <Section title="Crítica de la Musa" icon={<Wind size={14} />}>
                <p className="text-white/80 leading-relaxed italic">"{aiData.critique}"</p>
              </Section>

              <Section title="Misión Sugerida" icon={<ChevronRight size={14} />}>
                <p className="text-white/60 text-sm">{aiData.suggestion}</p>
              </Section>

              <Section title="Paleta Estelar" icon={<Palette size={14} />}>
                <div className="flex gap-3">
                  {aiData.palette.map((c, i) => (
                    <button key={i} onClick={() => setBrushColor(c)} className="flex-1 h-12 rounded-lg border border-white/10" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolbarButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-3 rounded-xl transition-all ${active ? 'bg-white text-black' : 'hover:bg-white/5 text-white/40'}`}>
    {icon}
  </button>
);

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-3">
    <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">{icon} {title}</h4>
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">{children}</div>
  </div>
);

export default App;
