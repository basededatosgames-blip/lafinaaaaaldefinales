
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Trash2, Download, Cpu, Palette, Zap, Brush, 
  Eraser, X, ChevronRight, Wind, Key, Wand2, Info
} from 'lucide-react';
import Canvas from './components/Canvas';
import { analyzeSketch, generateProVision } from './services/gemini';
import { AIResponse, AppState } from './types';

// Fix: Augment global Window interface with the specific structure of aistudio.
// Using readonly and inlining the type prevents conflicts with environment-provided types
// and avoids "All declarations of 'aistudio' must have identical modifiers" errors.
declare global {
  interface Window {
    readonly aistudio: {
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
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySetup(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Fix: Follow guideline to assume key selection was successful to mitigate race conditions
      setIsKeySetup(true);
    }
  };

  const handleClear = () => {
    if (window.confirm('¿Limpiar tu creación cósmica?')) {
      canvasRef.current?.clear();
    }
  };

  const handleAIAnalyze = async (mode: 'basic' | 'pro') => {
    if (!canvasRef.current) return;
    
    // Pro features (high quality image gen) require a paid key setup
    if (mode === 'pro' && !isKeySetup) {
      await handleOpenKeyDialog();
      // Fix: Guidelines state we should proceed to the app immediately after triggering the dialog.
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
      // Fix: Implementation of mandatory 404/billing error handling
      if (err.message?.includes("Requested entity was not found")) {
        setIsKeySetup(false);
        alert("Tu API Key parece ser inválida. Por favor, selecciona una de un proyecto con facturación activa.");
        if (window.aistudio) {
          await window.aistudio.openSelectKey();
        }
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
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden text-white">
      {/* Estrellas de fondo */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            initial={{ x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%`, opacity: Math.random() }}
            animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.4, 1] }}
            transition={{ duration: Math.random() * 4 + 2, repeat: Infinity }}
            style={{ width: '1.5px', height: '1.5px' }}
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

      {/* Barra de herramientas flotante */}
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 glass px-6 py-4 rounded-[2rem] flex items-center gap-6 shadow-2xl z-40 max-w-[95vw] overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center gap-1 pr-4 border-r border-white/10 shrink-0">
          <ToolbarButton active={tool === 'brush'} onClick={() => setTool('brush')} icon={<Brush size={18} />} />
          <ToolbarButton active={tool === 'neon'} onClick={() => setTool('neon')} icon={<Zap size={18} />} />
          <ToolbarButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={18} />} />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer outline-none" />
          <input type="range" min="1" max="50" value={brushWidth} onChange={(e) => setBrushWidth(parseInt(e.target.value))} className="w-24 accent-purple-500" />
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-white/10 shrink-0">
          <button onClick={handleClear} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"><Trash2 size={18} /></button>
          <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Download size={18} /></button>
          
          <div className="flex gap-2 ml-2">
            <button 
              onClick={() => handleAIAnalyze('basic')}
              className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border border-white/10 transition-colors"
            >
              <Cpu size={16} /> Analizar
            </button>
            <button 
              onClick={() => handleAIAnalyze('pro')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:brightness-110 shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all"
            >
              <Wand2 size={16} /> Remix IA
            </button>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-orbitron font-bold tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            NEBULA SKETCH
          </h1>
        </div>
        {!isKeySetup && (
          <button 
            onClick={handleOpenKeyDialog}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-all"
          >
            <Key size={14} /> ACTIVAR MODO PRO
          </button>
        )}
      </header>

      {/* Overlay de Carga */}
      <AnimatePresence>
        {appState === 'analyzing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-[#050505]/95 flex flex-col items-center justify-center backdrop-blur-xl">
             <div className="relative w-24 h-24">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-b-2 border-purple-500" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-t-2 border-blue-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-white w-6 h-6 animate-pulse" />
                </div>
             </div>
             <p className="text-sm font-orbitron mt-8 tracking-widest text-white/60 animate-pulse">GENERANDO VISIÓN...</p>
          </motion.div>
        )}

        {/* Panel de Resultados */}
        {appState === 'viewing-result' && aiData && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute top-0 right-0 w-full sm:w-[460px] h-full glass z-50 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-white/10">
              <h3 className="font-orbitron font-bold flex items-center gap-2 text-purple-400">
                <Sparkles size={20} /> MUSA ARTIFICIAL
              </h3>
              <button onClick={() => setAppState('drawing')} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {generatedImg ? (
                <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl relative group">
                  <img src={generatedImg} alt="AI Remix" className="w-full aspect-square object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                    <p className="text-xs italic text-white/80 line-clamp-2">"{aiData.backstory}"</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
                   <Info className="text-blue-400 shrink-0" size={18} />
                   <p className="text-xs text-blue-200 leading-relaxed">¿Quieres ver esto cobrar vida? Usa <strong>Remix IA</strong> para una generación fotorrealista de alta calidad.</p>
                </div>
              )}

              <Section title="Veredicto Estelar" icon={<Wind size={14} />}>
                <p className="text-white/80 text-sm leading-relaxed italic">"{aiData.critique}"</p>
              </Section>

              <Section title="Camino a Seguir" icon={<ChevronRight size={14} />}>
                <p className="text-white/60 text-xs leading-relaxed">{aiData.suggestion}</p>
              </Section>

              <Section title="Paleta Cósmica" icon={<Palette size={14} />}>
                <div className="grid grid-cols-4 gap-3">
                  {aiData.palette.map((c, i) => (
                    <motion.button 
                      key={i} 
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setBrushColor(c)} 
                      className="aspect-square rounded-lg border border-white/10 shadow-inner" 
                      style={{ backgroundColor: c }} 
                    />
                  ))}
                </div>
              </Section>
            </div>

            <div className="p-6 bg-white/[0.02]">
               <button 
                  onClick={() => setAppState('drawing')}
                  className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  VOLVER A DIBUJAR
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolbarButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-3 rounded-xl transition-all ${active ? 'bg-white text-black shadow-lg' : 'hover:bg-white/5 text-white/40'}`}>
    {icon}
  </button>
);

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-3">
    <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/30 flex items-center gap-2 font-bold">{icon} {title}</h4>
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 shadow-sm">{children}</div>
  </div>
);

export default App;
