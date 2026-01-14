import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Trash2, Download, Cpu, Palette, Zap, Brush, 
  Eraser, X, ChevronRight, Wind, Key, Wand2, Info, Layout
} from 'lucide-react';
import Canvas from './components/Canvas';
import { analyzeSketch, generateProVision } from './services/gemini';
import { AIResponse, AppState } from './types';

// Fix: Redefining global aistudio declaration to match environment's AIStudio interface and modifiers
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
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
      // Fix: Safely check for aistudio existence before calling methods
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setIsKeySetup(hasKey);
        } catch (e) {
          console.warn("AI Studio SDK not fully initialized");
        }
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setIsKeySetup(true);
    } else {
      alert("AI Studio environment not detected.");
    }
  };

  const handleClear = () => {
    if (window.confirm('¿Limpiar tu creación?')) {
      canvasRef.current?.clear();
    }
  };

  const handleAIAnalyze = async (mode: 'basic' | 'pro') => {
    if (!canvasRef.current) return;
    
    if (mode === 'pro' && !isKeySetup) {
      await handleOpenKeyDialog();
    }

    setAppState('analyzing');
    try {
      const canvasData = canvasRef.current.getCanvasData();
      const analysis = await analyzeSketch(canvasData, "Enfócate en la intención creativa.");
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
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        setIsKeySetup(false);
        alert("Tu API Key parece ser inválida o no tiene facturación activa.");
      } else {
        alert("Ocurrió un error al conectar con la IA. Intenta de nuevo.");
      }
      setAppState('drawing');
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'nebula-art.png';
    link.href = canvasRef.current.getCanvasData();
    link.click();
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden text-white font-inter">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,50,255,0.05),transparent_70%)]" />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full opacity-10"
            animate={{ opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: Math.random() * 5 + 2, repeat: Infinity }}
            style={{ 
              width: '1px', height: '1px', 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
          />
        ))}
      </div>

      <main className="w-full h-full">
        <Canvas 
          ref={canvasRef}
          color={tool === 'eraser' ? '#050505' : brushColor} 
          width={brushWidth}
          tool={tool}
        />
      </main>

      {/* Main Tool Bar */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-3xl flex items-center gap-6 shadow-2xl z-40 max-w-[90vw]"
      >
        <div className="flex items-center gap-1 pr-4 border-r border-white/5 shrink-0">
          <ToolbarButton active={tool === 'brush'} onClick={() => setTool('brush')} icon={<Brush size={18} />} label="Pincel" />
          <ToolbarButton active={tool === 'neon'} onClick={() => setTool('neon')} icon={<Zap size={18} />} label="Neón" />
          <ToolbarButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={18} />} label="Goma" />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="relative group">
            <input 
              type="color" 
              value={brushColor} 
              onChange={(e) => setBrushColor(e.target.value)} 
              className="w-10 h-10 rounded-xl bg-transparent border-none cursor-pointer outline-none overflow-hidden" 
            />
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Color</div>
          </div>
          <div className="flex flex-col gap-1">
             <input 
               type="range" min="1" max="50" 
               value={brushWidth} 
               onChange={(e) => setBrushWidth(parseInt(e.target.value))} 
               className="w-20 sm:w-32 accent-purple-500 h-1" 
             />
             <span className="text-[10px] text-white/30 text-center uppercase tracking-tighter">Grosor: {brushWidth}px</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-white/5 shrink-0">
          <button onClick={handleClear} className="p-3 hover:bg-red-500/10 rounded-xl text-red-500 transition-colors" title="Limpiar"><Trash2 size={18} /></button>
          <button onClick={handleDownload} className="p-3 hover:bg-white/5 rounded-xl text-white/60 transition-colors" title="Descargar"><Download size={18} /></button>
          
          <div className="flex gap-2 ml-2">
            <button 
              onClick={() => handleAIAnalyze('basic')}
              className="hidden sm:flex bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl text-xs font-semibold items-center gap-2 border border-white/10 transition-all"
            >
              <Cpu size={14} /> Analizar
            </button>
            <button 
              onClick={() => handleAIAnalyze('pro')}
              className="bg-gradient-to-br from-purple-500 to-indigo-600 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Wand2 size={14} /> Remix IA
            </button>
          </div>
        </div>
      </motion.div>

      {/* Branding */}
      <div className="absolute top-6 left-6 pointer-events-none z-30">
        <h1 className="text-xl font-orbitron font-bold tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          NEBULA SKETCH
        </h1>
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1">AI Studio for Creators</p>
      </div>

      {!isKeySetup && (
        <button 
          onClick={handleOpenKeyDialog}
          className="absolute top-6 right-6 px-4 py-2 rounded-xl glass border-yellow-500/20 text-yellow-500 text-[10px] font-bold flex items-center gap-2 hover:bg-yellow-500/10 transition-all z-30"
        >
          <Key size={12} /> HABILITAR PRO
        </button>
      )}

      {/* Analysis Overlay */}
      <AnimatePresence>
        {appState === 'analyzing' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center"
          >
             <div className="relative">
                <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                  />
                  <Sparkles className="text-white w-8 h-8 animate-pulse" />
                </div>
             </div>
             <h2 className="text-sm font-orbitron mt-8 tracking-[0.4em] text-white/40 animate-pulse uppercase">Canalizando la Musa...</h2>
          </motion.div>
        )}

        {/* Results Sidebar */}
        {appState === 'viewing-result' && aiData && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="absolute top-0 right-0 w-full sm:w-[420px] h-full glass border-l border-white/10 z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-orbitron text-xs font-bold tracking-widest text-purple-400 flex items-center gap-2 uppercase">
                <Sparkles size={16} /> Resultado IA
              </h3>
              <button onClick={() => setAppState('drawing')} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {generatedImg ? (
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    <img src={generatedImg} alt="AI Version" className="w-full aspect-square object-cover" />
                  </div>
                  <p className="text-xs text-white/50 italic leading-relaxed text-center px-4">"{aiData.backstory}"</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex gap-4">
                  <Info className="text-indigo-400 shrink-0" size={18} />
                  <p className="text-xs text-indigo-200/70 leading-relaxed">¿Te gusta este análisis? Prueba <strong>Remix IA</strong> para transformar tu boceto en una obra maestra visual.</p>
                </div>
              )}

              <ResultSection title="Crítica de la Musa" icon={<Wind size={14} />}>
                <p className="text-sm text-white/80 leading-relaxed">"{aiData.critique}"</p>
              </ResultSection>

              <ResultSection title="Camino Sugerido" icon={<ChevronRight size={14} />}>
                <p className="text-[13px] text-white/60 leading-relaxed">{aiData.suggestion}</p>
              </ResultSection>

              <ResultSection title="Paleta Estelar" icon={<Palette size={14} />}>
                <div className="grid grid-cols-4 gap-2">
                  {aiData.palette.map((c, i) => (
                    <button 
                      key={i} 
                      onClick={() => setBrushColor(c)}
                      className="aspect-square rounded-lg border border-white/5 hover:scale-105 transition-transform" 
                      style={{ backgroundColor: c }} 
                      title={c}
                    />
                  ))}
                </div>
              </ResultSection>
            </div>

            <div className="p-6 bg-black/40 border-t border-white/5">
               <button 
                  onClick={() => setAppState('drawing')}
                  className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 active:scale-95 transition-all text-xs uppercase tracking-widest"
                >
                  Continuar Creando
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolbarButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`p-3 rounded-2xl transition-all flex items-center gap-2 group ${active ? 'bg-white text-black shadow-xl' : 'hover:bg-white/5 text-white/30'}`}
    title={label}
  >
    {icon}
    {active && <span className="text-[10px] font-bold uppercase hidden sm:inline">{label}</span>}
  </button>
);

const ResultSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-3">
    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/20 flex items-center gap-2 font-bold">{icon} {title}</h4>
    <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">{children}</div>
  </div>
);

export default App;