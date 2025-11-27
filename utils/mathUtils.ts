import { Point3D, TransformState } from '../types';
import * as THREE from 'three';

// Generate random points on a sphere surface
export const generateSpherePoints = (count: number, radius: number, noise: number = 0): Float32Array => {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;

    const nX = (Math.random() - 0.5) * noise;
    const nY = (Math.random() - 0.5) * noise;
    const nZ = (Math.random() - 0.5) * noise;

    points[i * 3] = radius * Math.cos(theta) * Math.sin(phi) + nX;
    points[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi) + nY;
    points[i * 3 + 2] = radius * Math.cos(phi) + nZ;
  }
  return points;
};

// Generate points in a cube
export const generateCubePoints = (count: number, size: number, noise: number = 0): Float32Array => {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    points[i * 3] = (Math.random() - 0.5) * size + (Math.random() - 0.5) * noise;
    points[i * 3 + 1] = (Math.random() - 0.5) * size + (Math.random() - 0.5) * noise;
    points[i * 3 + 2] = (Math.random() - 0.5) * size + (Math.random() - 0.5) * noise;
  }
  return points;
};

// Calculate Centroid
export const calculateCentroid = (points: Float32Array): [number, number, number] => {
  if (points.length === 0) return [0,0,0];
  let x = 0, y = 0, z = 0;
  const count = points.length / 3;
  for (let i = 0; i < points.length; i += 3) {
    x += points[i];
    y += points[i + 1];
    z += points[i + 2];
  }
  return [x / count, y / count, z / count];
};

// Shift all points by a vector (used to center the world on the first uploaded cloud)
export const shiftPoints = (points: Float32Array, offsetX: number, offsetY: number, offsetZ: number): Float32Array => {
    const newPoints = new Float32Array(points.length);
    for (let i = 0; i < points.length; i += 3) {
        newPoints[i] = points[i] - offsetX;
        newPoints[i + 1] = points[i + 1] - offsetY;
        newPoints[i + 2] = points[i + 2] - offsetZ;
    }
    return newPoints;
};

// Calculate bounding radius of the cloud (for camera zoom)
export const calculateBoundingRadius = (points: Float32Array): number => {
    if (points.length === 0) return 10;
    let maxDistSq = 0;
    for(let i = 0; i < points.length; i += 3) {
        const dSq = points[i]*points[i] + points[i+1]*points[i+1] + points[i+2]*points[i+2];
        if(dSq > maxDistSq) maxDistSq = dSq;
    }
    return Math.sqrt(maxDistSq);
};

// Apply transform to a point (Used for RMSE calculation on CPU side)
export const applyTransform = (point: [number, number, number], transform: TransformState): [number, number, number] => {
  const vec = new THREE.Vector3(point[0], point[1], point[2]);
  
  // Rotation (Euler XYZ)
  const euler = new THREE.Euler(transform.rotation[0], transform.rotation[1], transform.rotation[2], 'XYZ');
  vec.applyEuler(euler);
  
  // Translation
  vec.add(new THREE.Vector3(transform.position[0], transform.position[1], transform.position[2]));
  
  return [vec.x, vec.y, vec.z];
};

// Calculate simplified RMSE
export const calculateRMSE = (source: Float32Array, target: Float32Array, transform: TransformState): number => {
  const sampleSize = Math.min(100, source.length / 3); // sparse sample
  let errorSum = 0;

  for (let i = 0; i < sampleSize; i++) {
    const sIdx = Math.floor(Math.random() * (source.length / 3)) * 3;
    const sPoint: [number, number, number] = [source[sIdx], source[sIdx+1], source[sIdx+2]];
    const transformedS = applyTransform(sPoint, transform);

    let minDistSq = Infinity;
    // Find nearest in target (Brute force on small sample of target)
    const targetCheckCount = Math.min(200, target.length / 3);
    for (let j = 0; j < targetCheckCount; j++) {
       const tIdx = Math.floor(Math.random() * (target.length / 3)) * 3;
       const dx = transformedS[0] - target[tIdx];
       const dy = transformedS[1] - target[tIdx+1];
       const dz = transformedS[2] - target[tIdx+2];
       const dSq = dx*dx + dy*dy + dz*dz;
       if (dSq < minDistSq) minDistSq = dSq;
    }
    errorSum += minDistSq;
  }

  return Math.sqrt(errorSum / sampleSize);
};