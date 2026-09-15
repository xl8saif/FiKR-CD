import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl?: string;
  durationSec?: number;
  label?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, durationSec, label }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioUrl) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[#666]">
        <Volume2 className="h-3 w-3 opacity-40 text-[#666]" /> No audio
      </span>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
      setIsPlaying(true);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#181818] border border-[#2D2D2D] px-2.5 py-1 text-xs">
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A66B] text-[#0C0C0C] hover:bg-[#D4B582] transition"
        title="Play native pronunciation"
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
      </button>
      <span className="font-medium text-[#E5E5E5] text-[11px]">
        {label || 'Listen IK Pronunciation'} {durationSec ? `(${durationSec}s)` : ''}
      </span>
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};
