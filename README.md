# NebulaReg

NebulaReg is a professional-grade, web-based 3D point cloud registration system designed for visualization, manipulation, and alignment of complex 3D datasets.

## Features

- **Multi-Format Support**: Native loading of **.PLY** (Polygon File Format) and **.PCD** (Point Cloud Data) files.
- **Large Coordinate Handling**: Intelligent offset system to handle georeferenced data (e.g., UTM coordinates) without floating-point jitter, preserving relative spatial accuracy.
- **Interactive Visualization**: GPU-accelerated rendering capable of handling dense point clouds with depth cues and perspective controls.
- **Registration Toolkit**:
  - **6-DOF Control**: Precise manual translation and rotation controls.
  - **Auto-Centering**: One-click centroid alignment for rough registration.
  - **Real-time Error Metrics**: Live Root Mean Square Error (RMSE) calculation.
- **AI-Powered Analysis**: Integrated **Gemini 2.5** spatial reasoning to analyze geometric relationships and suggest alignment corrections.

## Usage

1. **Import Data**: Upload your Source (moving) and Target (fixed) point clouds via the toolbar.
2. **Rough Align**: Use the "Auto Centroid Align" button to bring datasets into the same viewing volume.
3. **Fine Tune**: Adjust X/Y/Z translation and rotation sliders to perfect the overlay.
4. **Analyze**: Use the AI Engineer panel to generate insights about the registration quality.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **3D Engine**: Three.js, React Three Fiber
- **AI Integration**: Google GenAI SDK (Gemini 2.5 Flash)
