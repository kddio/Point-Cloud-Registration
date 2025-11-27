import React, { useState, useEffect, useCallback, useRef } from 'react';
import Viewer3D from './components/Viewer3D';
import ControlPanel from './components/ControlPanel';
import AIAnalysis from './components/AIAnalysis';
import { generateSpherePoints, generateCubePoints, calculateCentroid, calculateRMSE, shiftPoints, calculateBoundingRadius } from './utils/mathUtils';
import { loadPointCloudFile } from './utils/fileLoader';
import { INITIAL_TRANSFORM } from './constants';
import { TransformState, SampleType } from './types';
import { analyzeRegistration } from './services/geminiService';
import { Layers, FileBox, UploadCloud, AlertCircle } from 'lucide-react';

// Standard datasets
const DATASETS = {
  [SampleType.EMPTY]: {
    source: new Float32Array(0),
    target: new Float32Array(0),
    initialOffset: { x: 0, y: 0, z: 0 }
  },
  [SampleType.SPHERE]: {
    source: generateSpherePoints(2000, 3, 0.1), // Noisier source
    target: generateSpherePoints(2000, 3, 0.05), // Clean target
    initialOffset: { x: 5, y: 3, z: -2 }
  },
  [SampleType.CUBE]: {
    source: generateCubePoints(3000, 4, 0.1),
    target: generateCubePoints(3000, 4, 0.02),
    initialOffset: { x: -4, y: 2, z: 4 }
  },
  [SampleType.TORUS]: { 
    source: generateSpherePoints(1000, 3, 0),
    target: generateSpherePoints(1000, 3, 0),
    initialOffset: { x: 0, y: 0, z: 0 }
  },
  [SampleType.CUSTOM]: {
    source: new Float32Array(0),
    target: new Float32Array(0),
    initialOffset: { x: 0, y: 0, z: 0 }
  }
};

const App: React.FC = () => {
  // State
  const [dataset, setDataset] = useState<SampleType>(SampleType.EMPTY);
  const [sourcePoints, setSourcePoints] = useState<Float32Array>(DATASETS[SampleType.EMPTY].source);
  const [targetPoints, setTargetPoints] = useState<Float32Array>(DATASETS[SampleType.EMPTY].target);
  
  // World Center Offset (to handle large coordinates like UTM)
  // We subtract this from all uploaded points to center the SCENE at 0,0,0
  // while maintaining relative positions between source and target.
  const [worldOffset, setWorldOffset] = useState<[number, number, number] | null>(null);
  const [sceneScale, setSceneScale] = useState<number>(10); // To adjust slider sensitivity

  const [transform, setTransform] = useState<TransformState>({
    ...INITIAL_TRANSFORM,
    position: [0, 0, 0]
  });

  const [rmse, setRmse] = useState<number>(0);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hidden file input refs
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  // Calculate RMSE whenever transform or points change
  useEffect(() => {
    if (sourcePoints.length > 0 && targetPoints.length > 0) {
      const error = calculateRMSE(sourcePoints, targetPoints, transform);
      setRmse(error);
    } else {
      setRmse(0);
    }
  }, [transform, sourcePoints, targetPoints]);

  // Handle Dataset Change
  const handleDatasetChange = (type: SampleType) => {
    if (type === SampleType.CUSTOM) return; 
    if (type === SampleType.EMPTY) {
      setDataset(SampleType.EMPTY);
      setSourcePoints(new Float32Array(0));
      setTargetPoints(new Float32Array(0));
      setWorldOffset(null);
      return;
    }

    setDataset(type);
    setSourcePoints(DATASETS[type].source);
    setTargetPoints(DATASETS[type].target);
    setWorldOffset(null); // Standard datasets are already centered
    setSceneScale(10); // Standard datasets are small

    const offset = DATASETS[type].initialOffset;
    setTransform({
      ...INITIAL_TRANSFORM,
      position: [offset.x, offset.y, offset.z]
    });
    setAiOutput(null);
    setErrorMsg(null);
  };

  // Auto Align Logic (Centroid Matching)
  const handleAutoAlign = () => {
    if (sourcePoints.length === 0 || targetPoints.length === 0) return;

    const sCentroid = calculateCentroid(sourcePoints);
    const tCentroid = calculateCentroid(targetPoints);

    const translation: [number, number, number] = [
      tCentroid[0] - sCentroid[0],
      tCentroid[1] - sCentroid[1],
      tCentroid[2] - sCentroid[2]
    ];

    setTransform(prev => ({
      ...prev,
      position: translation
    }));
  };

  // AI Analysis Logic
  const handleAIAnalyze = async () => {
    setIsAiLoading(true);
    const result = await analyzeRegistration(sourcePoints, targetPoints, transform);
    setAiOutput(result);
    setIsAiLoading(false);
  };

  // File Upload Handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isSource: boolean) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setDataset(SampleType.CUSTOM);

    try {
      const points = await loadPointCloudFile(file);
      
      if (points.length === 0) {
        throw new Error("File contains no point data.");
      }

      // 1. Determine World Offset (if not set)
      let currentOffset = worldOffset;
      if (!currentOffset) {
        // Use the centroid of the first uploaded file as the world center
        // This prevents jitter for large coordinate systems (e.g. UTM)
        const center = calculateCentroid(points);
        currentOffset = center;
        setWorldOffset(center);
      }

      // 2. Shift points by the world offset
      // This moves the scene to (0,0,0) but KEEPS relative positions if multiple files are uploaded
      const centeredPoints = shiftPoints(points, currentOffset[0], currentOffset[1], currentOffset[2]);

      // 3. Calculate bounds to adjust UI sliders
      const radius = calculateBoundingRadius(centeredPoints);
      setSceneScale(prev => Math.max(prev, radius));

      if (isSource) {
        setSourcePoints(centeredPoints);
        // Reset transform for new custom source
        setTransform(INITIAL_TRANSFORM);
      } else {
        setTargetPoints(centeredPoints);
      }
      setAiOutput(null); 
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload file");
      console.error(err);
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = ''; 
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 justify-between z-20 relative shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-600/20 rounded text-sky-400">
             <Layers size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white leading-none">
              Nebula<span className="text-sky-400">Reg</span>
            </h1>
            <span className="text-[10px] font-mono text-slate-500">Professional Point Cloud Registration</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-900/20 px-3 py-1.5 rounded border border-red-900/50 animate-pulse">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}

          {/* Dataset Switcher */}
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 items-center">
             <button 
              onClick={() => handleDatasetChange(SampleType.EMPTY)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${dataset === SampleType.EMPTY ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Clear
            </button>
            <button 
              onClick={() => handleDatasetChange(SampleType.SPHERE)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${dataset === SampleType.SPHERE ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Sphere
            </button>
          </div>

          <div className="h-8 w-px bg-slate-800 mx-1"></div>

          {/* Upload Controls */}
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={sourceInputRef} 
              onChange={(e) => handleFileUpload(e, true)} 
              className="hidden" 
              accept=".pcd,.ply"
            />
            <input 
              type="file" 
              ref={targetInputRef} 
              onChange={(e) => handleFileUpload(e, false)} 
              className="hidden" 
              accept=".pcd,.ply"
            />

            <button 
              onClick={() => sourceInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded border border-slate-600 transition-all"
            >
              <UploadCloud size={14} className="text-sky-400" />
              {isUploading ? 'Loading...' : 'Upload Source'}
            </button>
            
            <button 
              onClick={() => targetInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded border border-slate-600 transition-all"
            >
              <UploadCloud size={14} className="text-pink-400" />
              {isUploading ? 'Loading...' : 'Upload Target'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Manual Controls */}
        <ControlPanel 
          transform={transform} 
          setTransform={setTransform} 
          onAutoAlign={handleAutoAlign}
          onReset={() => setTransform(INITIAL_TRANSFORM)}
          rmse={rmse}
          scaleFactor={sceneScale}
        />

        {/* Center: 3D View */}
        <div className="flex-1 p-0 relative bg-slate-950 flex flex-col">
          {/* Empty State Message */}
          {dataset === SampleType.EMPTY && sourcePoints.length === 0 && targetPoints.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center z-0 text-slate-700 flex-col pointer-events-none">
                <FileBox size={64} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="font-mono text-sm">No point clouds loaded.</p>
                <p className="font-mono text-xs opacity-50 mt-1">Upload a .PLY or .PCD file to begin.</p>
             </div>
          )}

          <Viewer3D 
            sourcePoints={sourcePoints} 
            targetPoints={targetPoints} 
            sourceTransform={transform} 
          />
          
          {/* Info Overlay */}
          {(sourcePoints.length > 0 || targetPoints.length > 0) && (
             <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur p-3 rounded border border-slate-800 text-xs text-slate-400 font-mono">
               <div className="font-bold text-slate-300 mb-1">Scene Info</div>
               <div>Source Points: {sourcePoints.length / 3}</div>
               <div>Target Points: {targetPoints.length / 3}</div>
               {worldOffset && <div className="mt-1 text-[10px] opacity-70">Origin Offset Applied</div>}
             </div>
          )}
        </div>

        {/* Right: AI & Info */}
        <AIAnalysis 
          analysis={aiOutput} 
          isLoading={isAiLoading} 
          onAnalyze={handleAIAnalyze} 
        />
      </main>
    </div>
  );
};

export default App;