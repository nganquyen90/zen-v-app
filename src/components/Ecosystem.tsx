import { useState } from 'react';
import { Leaf, Droplets, Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';

export default function Ecosystem() {
  const [waterLevel, setWaterLevel] = useState(30);
  const [growthStage, setGrowthStage] = useState(1); // 1: Seed, 2: Sprout, 3: Plant

  const handleAction = (type: 'water' | 'sleep' | 'sun') => {
    setWaterLevel(prev => Math.min(prev + 20, 100));
    if (waterLevel > 70 && growthStage < 3) {
      setGrowthStage(prev => prev + 1);
      setWaterLevel(0); // Reset for next stage
    }
  };

  return (
    <div className="p-6 space-y-8 pb-24 flex flex-col items-center justify-center min-h-full">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-serif text-sage-800">Your Ecosystem</h2>
        <p className="text-sage-600 text-sm">Nurture yourself to nurture your plant.</p>
      </div>

      {/* Plant Visualization */}
      <div className="relative w-64 h-64 bg-white rounded-full shadow-inner border-4 border-sage-100 flex items-end justify-center overflow-hidden">
        {/* Soil */}
        <div className="absolute bottom-0 w-full h-1/4 bg-[#8b5a2b] opacity-80 rounded-b-full z-10" />
        
        {/* Plant Stages */}
        <motion.div 
          className="relative z-20 mb-8"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          key={growthStage}
        >
          {growthStage === 1 && (
            <div className="w-8 h-8 bg-sage-400 rounded-full shadow-lg border-2 border-sage-600" />
          )}
          {growthStage === 2 && (
            <div className="flex flex-col items-center">
              <Leaf size={48} className="text-sage-500 -mb-2" />
              <div className="w-2 h-12 bg-sage-600 rounded-full" />
            </div>
          )}
          {growthStage === 3 && (
            <div className="flex flex-col items-center">
              <div className="flex gap-4">
                <Leaf size={64} className="text-sage-500 transform -rotate-45" />
                <Leaf size={64} className="text-sage-500 transform rotate-45" />
              </div>
              <div className="w-3 h-24 bg-sage-600 rounded-full" />
            </div>
          )}
        </motion.div>

        {/* Water Level Indicator */}
        <div 
          className="absolute bottom-0 left-0 w-full bg-softblue-400/30 transition-all duration-1000 z-0"
          style={{ height: `${waterLevel}%` }}
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        <button 
          onClick={() => handleAction('water')}
          className="flex flex-col items-center gap-2 p-4 bg-softblue-50 rounded-2xl hover:bg-softblue-100 transition-colors border border-softblue-100"
        >
          <Droplets size={24} className="text-softblue-500" />
          <span className="text-xs font-medium text-slate-600">Drank Water</span>
        </button>
        <button 
          onClick={() => handleAction('sleep')}
          className="flex flex-col items-center gap-2 p-4 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-colors border border-indigo-100"
        >
          <Moon size={24} className="text-indigo-500" />
          <span className="text-xs font-medium text-slate-600">Slept 8h</span>
        </button>
        <button 
          onClick={() => handleAction('sun')}
          className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-2xl hover:bg-orange-100 transition-colors border border-orange-100"
        >
          <Sun size={24} className="text-orange-500" />
          <span className="text-xs font-medium text-slate-600">Went Outside</span>
        </button>
      </div>

      <div className="w-full max-w-xs bg-white p-4 rounded-2xl shadow-sm border border-sage-100 text-center">
        <p className="text-sm text-sage-700 font-medium">
          {growthStage === 1 ? "Your seed is resting. Keep hydrating!" : 
           growthStage === 2 ? "A sprout! Your healthy habits are paying off." : 
           "A beautiful plant! You're thriving."}
        </p>
      </div>
    </div>
  );
}
