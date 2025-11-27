import React from 'react';
import { TransformState } from '../types';
import { RefreshCw, Move, Rotate3D, MousePointerClick } from 'lucide-react';

interface ControlPanelProps {
  transform: TransformState;
  setTransform: React.Dispatch<React.SetStateAction<TransformState>>;
  onAutoAlign: () => void;
  onReset: () => void;
  rmse: number;
  scaleFactor?: number;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, step = 0.1, onChange }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
      <span>{label}</span>
      <span>{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
    />
  </div>
);

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  transform, 
  setTransform, 
  onAutoAlign, 
  onReset, 
  rmse,
  scaleFactor = 20 
}) => {
  
  // Adjust range based on the size of the object
  // Minimum range is 10, otherwise use scaleFactor
  const range = Math.max(10, scaleFactor);
  
  const updatePos = (idx: number, val: number) => {
    const newPos = [...transform.position] as [number, number, number];
    newPos[idx] = val;
    setTransform({ ...transform, position: newPos });
  };

  const updateRot = (idx: number, val: number) => {
    const newRot = [...transform.rotation] as [number, number, number];
    newRot[idx] = val;
    setTransform({ ...transform, rotation: newRot });
  };

  return (
    <div className="bg-slate-800 border-r border-slate-700 p-4 flex flex-col h-full w-80 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Move size={20} className="text-sky-400" />
          Registration
        </h2>
        <p className="text-xs text-slate-400 mt-1">Manual alignment controls</p>
      </div>

      {/* Translation */}
      <div className="mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
        <h3 className="text-sm font-semibold text-sky-300 mb-3 flex items-center gap-2">
          <Move size={14} /> Translation
        </h3>
        <Slider 
          label="X Axis" 
          value={transform.position[0]} 
          min={-range} max={range} 
          step={range / 200}
          onChange={(v) => updatePos(0, v)} 
        />
        <Slider 
          label="Y Axis" 
          value={transform.position[1]} 
          min={-range} max={range} 
          step={range / 200}
          onChange={(v) => updatePos(1, v)} 
        />
        <Slider 
          label="Z Axis" 
          value={transform.position[2]} 
          min={-range} max={range} 
          step={range / 200}
          onChange={(v) => updatePos(2, v)} 
        />
      </div>

      {/* Rotation */}
      <div className="mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
        <h3 className="text-sm font-semibold text-pink-300 mb-3 flex items-center gap-2">
          <Rotate3D size={14} /> Rotation (Rad)
        </h3>
        <Slider label="X Axis" value={transform.rotation[0]} min={-Math.PI} max={Math.PI} onChange={(v) => updateRot(0, v)} />
        <Slider label="Y Axis" value={transform.rotation[1]} min={-Math.PI} max={Math.PI} onChange={(v) => updateRot(1, v)} />
        <Slider label="Z Axis" value={transform.rotation[2]} min={-Math.PI} max={Math.PI} onChange={(v) => updateRot(2, v)} />
      </div>

      {/* Metrics */}
      <div className="mb-6 bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
         <h4 className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Alignment Error (RMSE)</h4>
         <div className={`text-2xl font-mono font-bold ${rmse < (range * 0.05) ? 'text-emerald-400' : 'text-amber-400'}`}>
           {rmse.toFixed(4)}
         </div>
      </div>

      <div className="mt-auto space-y-3">
        <button 
          onClick={onAutoAlign}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-sky-900/20"
        >
          <MousePointerClick size={16} /> Auto Centroid Align
        </button>
        <button 
          onClick={onReset}
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <RefreshCw size={16} /> Reset Transform
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;