export const COLORS = {
  source: '#38bdf8', // Sky Blue
  target: '#f472b6', // Pink
  grid: '#334155',
  background: '#0f172a'
};

export const MAX_POINTS_FOR_AI = 50; // Limit points sent to Gemini to avoid token limits

export const INITIAL_TRANSFORM = {
  position: [0, 0, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  scale: 1
};
