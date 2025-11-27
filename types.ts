import { Vector3 } from 'three';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface TransformState {
  position: [number, number, number]; // x, y, z
  rotation: [number, number, number]; // x, y, z in radians
  scale: number;
}

export interface CloudMetadata {
  id: string;
  name: string;
  pointCount: number;
  color: string;
}

export interface AnalysisResult {
  rmse: number;
  status: 'Aligned' | 'Misaligned' | 'Unknown';
  aiInsights?: string;
}

export enum SampleType {
  EMPTY = 'EMPTY',
  CUBE = 'CUBE',
  SPHERE = 'SPHERE',
  TORUS = 'TORUS',
  CUSTOM = 'CUSTOM'
}