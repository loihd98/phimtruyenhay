"use client";

import React from "react";
import SimpleAudioPlayer from "./SimpleAudioPlayer";

const AudioPlayerDemo: React.FC = () => {
  // Sample audio URL - you can replace with actual audio files
  const sampleAudio = "/uploads/audio/sample.mp3";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          🎵 Enhanced Audio Player
        </h1>
        <p className="text-zinc-500">
          Với các tính năng mới: Tốc độ phát, Skip, Loop, Phím tắt
        </p>
      </div>

      {/* Feature list */}
      <div className="bg-white/[0.02] rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-white">
          ✨ Tính năng mới
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-primary-400">⚡</span>
              <span>Tốc độ phát: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-400">⏭️</span>
              <span>Skip ±10 giây</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-400">🔄</span>
              <span>Lặp lại audio</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary-400">🎛️</span>
              <span>Thanh tiến trình cải tiến</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-500">⌨️</span>
              <span>Phím tắt: Space (phát/dừng)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">⌨️</span>
              <span>← → (tua lại/tới)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">⌨️</span>
              <span>↑ ↓ (âm lượng)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">⌨️</span>
              <span>L (lặp lại)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audio player */}
      <SimpleAudioPlayer
        src={sampleAudio}
        title="Sample Audio - Enhanced Player Demo"
      />

      {/* Usage instructions */}
      <div className="bg-primary-500/5 /20 rounded-lg p-4 border border-primary-500/20">
        <h3 className="font-semibold text-primary-300  mb-2">
          📖 Hướng dẫn sử dụng
        </h3>
        <ul className="text-sm text-primary-400  space-y-1">
          <li>• Click vào số tốc độ để thay đổi tốc độ phát</li>
          <li>• Sử dụng nút skip để tua lại/tới 10 giây</li>
          <li>
            • Click vào thời gian để chuyển đổi hiển thị thời gian còn lại
          </li>
          <li>• Hover vào "⌨️ Phím tắt" để xem danh sách phím tắt</li>
          <li>• Click nút loop để bật/tắt lặp lại</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioPlayerDemo;
