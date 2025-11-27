import { GoogleGenAI } from "@google/genai";
import { TransformState } from "../types";
import { calculateCentroid } from "../utils/mathUtils";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API Key not found in environment variables");
        throw new Error("API Key missing");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeRegistration = async (
    sourcePoints: Float32Array,
    targetPoints: Float32Array,
    currentTransform: TransformState
): Promise<string> => {
    try {
        const client = getClient();
        const sourceCentroid = calculateCentroid(sourcePoints);
        const targetCentroid = calculateCentroid(targetPoints);

        // Create a compact string representation of a few points
        const sampleCount = 5;
        let sourceSample = "";
        let targetSample = "";
        
        for(let i=0; i<sampleCount; i++) {
            sourceSample += `[${sourcePoints[i*3].toFixed(2)},${sourcePoints[i*3+1].toFixed(2)},${sourcePoints[i*3+2].toFixed(2)}] `;
            targetSample += `[${targetPoints[i*3].toFixed(2)},${targetPoints[i*3+1].toFixed(2)},${targetPoints[i*3+2].toFixed(2)}] `;
        }

        const prompt = `
        You are an expert 3D Geometry and Computer Vision Engineer.
        I am performing a rigid point cloud registration task.
        
        Data Statistics:
        - Source Point Cloud Centroid (Initial): [${sourceCentroid.join(', ')}]
        - Target Point Cloud Centroid: [${targetCentroid.join(', ')}]
        - Current Applied Transform: Position [${currentTransform.position.join(', ')}], Rotation [${currentTransform.rotation.join(', ')}]
        
        Source Sample Points (First 5): ${sourceSample}
        Target Sample Points (First 5): ${targetSample}

        Task:
        1. Analyze the spatial relationship based on the centroids.
        2. Comment on the alignment quality (Are they close? Is there a large offset?).
        3. Provide a recommendation for the next step in registration (e.g., "Move X by +5 units", "Rotate Z axis").
        4. Keep the response concise, professional, and technical (under 150 words).
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "No analysis generated.";

    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return "Error connecting to AI analysis service. Please check your API key or connection.";
    }
};
