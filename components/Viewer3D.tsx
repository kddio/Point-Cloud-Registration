import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { TransformState } from '../types';
import { COLORS } from '../constants';
import { calculateBoundingRadius, calculateCentroid } from '../utils/mathUtils';

// Fix for missing React Three Fiber JSX elements in TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
      pointLight: any;
      color: any;
      [elemName: string]: any;
    }
  }
}

interface PointCloudProps {
  points: Float32Array;
  color: string;
  transform?: TransformState;
  opacity?: number;
}

const PointCloud: React.FC<PointCloudProps> = ({ points, color, transform, opacity = 1 }) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const meshRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (meshRef.current && transform) {
      meshRef.current.position.set(...transform.position);
      meshRef.current.rotation.set(...transform.rotation);
      meshRef.current.scale.setScalar(transform.scale);
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={color}
        sizeAttenuation={true}
        transparent={true}
        opacity={opacity}
      />
    </points>
  );
};

// Camera controller that zooms to fit the points
const AutoFitCamera: React.FC<{ points1: Float32Array; points2: Float32Array }> = ({ points1, points2 }) => {
  const { camera, controls } = useThree();
  const hasFitRef = useRef(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const totalPoints = points1.length + points2.length;
    
    // If we have points and (it's the first load OR the point count changed significantly), refit
    if (totalPoints > 0 && (totalPoints !== prevCountRef.current)) {
      
      // Determine which set to focus on. If target exists (points2), it's fixed, so focus there.
      // If only source exists, focus there.
      const targetToUse = points2.length > 0 ? points2 : points1;
      
      // Use math utils to get radius estimate
      const radius = calculateBoundingRadius(targetToUse);
      const center = calculateCentroid(targetToUse);
      
      // Move controls target to center of cloud
      if (controls) {
        // @ts-ignore
        controls.target.set(center[0], center[1], center[2]);
        // @ts-ignore
        controls.update();
      }

      // Move camera back enough to see everything
      // Default view direction is roughly diagonal
      const dist = radius * 2.5;
      camera.position.set(center[0] + dist, center[1] + dist, center[2] + dist);
      camera.updateProjectionMatrix();
      
      prevCountRef.current = totalPoints;
    }
  }, [points1, points2, camera, controls]);

  return null;
};

interface Viewer3DProps {
  sourcePoints: Float32Array;
  targetPoints: Float32Array;
  sourceTransform: TransformState;
}

const Viewer3D: React.FC<Viewer3DProps> = ({ sourcePoints, targetPoints, sourceTransform }) => {
  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-2xl border border-slate-700 relative">
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md p-2 rounded text-xs text-slate-300 font-mono pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.source }}></div>
          <span>Source (Moving)</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.target }}></div>
          <span>Target (Fixed)</span>
        </div>
      </div>

      <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
        <color attach="background" args={[COLORS.background]} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        <PointCloud points={sourcePoints} color={COLORS.source} transform={sourceTransform} />
        <PointCloud points={targetPoints} color={COLORS.target} opacity={0.6} />

        <AutoFitCamera points1={sourcePoints} points2={targetPoints} />

        <Grid
          position={[0, -5, 0]}
          args={[100, 100]}
          cellColor="#475569"
          sectionColor="#64748b"
          fadeDistance={50}
          fadeStrength={1}
        />

        <OrbitControls makeDefault />
        
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="black" />
        </GizmoHelper>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default Viewer3D;