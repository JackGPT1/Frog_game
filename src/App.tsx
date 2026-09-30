import { useEffect, useRef } from 'react';
import { initGame } from './game.js';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 初始化遊戲，取得清理函式
    const cleanup = initGame(canvas);

    // 元件卸載時清理
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-white text-2xl font-bold mb-4">
        🐸 Keroro Runner
      </h1>
      <canvas
        ref={canvasRef}
        className="border-4 border-gray-700 rounded-lg shadow-2xl cursor-pointer"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="mt-4 text-gray-400 text-sm text-center">
        <p>← → 或 A D 移動 ｜ ↑ 或 W 或空白鍵 跳躍 ｜ Enter 開始/重新開始</p>
      </div>
    </div>
  );
}
