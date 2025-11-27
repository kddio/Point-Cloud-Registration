import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import * as THREE from 'three';

export const loadPointCloudFile = async (file: File): Promise<Float32Array> => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) {
        reject(new Error("Failed to read file"));
        return;
      }

      try {
        if (extension === 'pcd') {
          const loader = new PCDLoader();
          // PCDLoader.parse signature can vary slightly in TS types, but usually accepts (data, url)
          // Passing empty string as url helps satisfy some definitions
          const points = loader.parse(result as ArrayBuffer, '');
          
          const geometry = points.geometry;
          if (geometry && geometry.attributes.position) {
             resolve(geometry.attributes.position.array as Float32Array);
          } else {
             reject(new Error("No position data found in PCD file"));
          }
          
        } else if (extension === 'ply') {
          const loader = new PLYLoader();
          const geometry = loader.parse(result as ArrayBuffer);
          geometry.computeVertexNormals();
          
          if (geometry && geometry.attributes.position) {
             resolve(geometry.attributes.position.array as Float32Array);
          } else {
            reject(new Error("No position data found in PLY file"));
          }

        } else {
          reject(new Error(`Unsupported file extension: .${extension}. Please use .pcd or .ply`));
        }
      } catch (error) {
        console.error("Parse error:", error);
        reject(new Error("Failed to parse point cloud data. File may be corrupted or format unsupported."));
      }
    };

    reader.onerror = () => reject(new Error("File read error"));
    
    // Read as ArrayBuffer for both loaders
    reader.readAsArrayBuffer(file);
  });
};