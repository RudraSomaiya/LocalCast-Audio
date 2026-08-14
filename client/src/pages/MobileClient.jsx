import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Activity } from 'lucide-react';

export default function MobileClient() {
  const [joined, setJoined] = useState(false);
  const [volume, setVolume] = useState(1);
  const [offset, setOffset] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const wsRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const wakeLockRef = useRef(null);

  const handleJoin = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.error('Wake lock error', err);
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtxRef.current = new AudioContext({ latencyHint: 'interactive', sampleRate: 48000 });
    
    gainNodeRef.current = audioCtxRef.current.createGain();
    gainNodeRef.current.connect(audioCtxRef.current.destination);
    gainNodeRef.current.gain.value = volume;

    setJoined(true);
    connectWebSocket();
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    wsRef.current = new WebSocket(wsUrl);
    wsRef.current.binaryType = 'arraybuffer';

    wsRef.current.onopen = () => {
      setIsConnected(true);
      wsRef.current.send(JSON.stringify({ type: 'register_listener' }));
    };

    wsRef.current.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'set_offset') {
            setOffset(data.offset);
          }
        } catch (e) {}
        return;
      }

      // Handle binary PCM (s16le)
      if (!audioCtxRef.current) return;
      
      const int16Array = new Int16Array(event.data);
      const numChannels = 2;
      const numFrames = int16Array.length / numChannels;
      
      if (numFrames <= 0) return;

      const audioBuffer = audioCtxRef.current.createBuffer(numChannels, numFrames, 48000);
      
      // Convert Int16 to Float32
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < numFrames; i++) {
          channelData[i] = int16Array[i * numChannels + channel] / 32768.0;
        }
      }

      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);

      const currentTime = audioCtxRef.current.currentTime;
      // Convert offset ms to seconds
      const offsetSeconds = offset / 1000.0;
      
      // Add a small jitter buffer (e.g. 30ms) to ensure smooth playback
      const jitterBuffer = 0.03; 
      
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime + jitterBuffer;
      }

      let playTime = nextPlayTimeRef.current + offsetSeconds;
      
      // Never schedule in the past
      if (playTime < currentTime) {
         playTime = currentTime;
      }

      source.start(playTime);
      nextPlayTimeRef.current += audioBuffer.duration;
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      setTimeout(() => {
        if (joined) connectWebSocket();
      }, 1000);
    };
  };

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  if (!joined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm text-center w-full">
          <Activity className="w-12 h-12 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Movie Night Audio</h1>
          <p className="text-muted-foreground mb-8">Tap below to join the live audio stream. Please use headphones!</p>
          <button 
            onClick={handleJoin}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition-transform active:scale-95"
          >
            <Play className="w-6 h-6" fill="currentColor" /> Join Audio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
      <div className="bg-card border border-border p-8 rounded-2xl shadow-sm text-center w-full relative overflow-hidden">
        {isConnected && (
          <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse" />
        )}
        
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 transition-colors ${isConnected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Volume2 className="w-10 h-10" />
        </div>
        
        <h2 className="text-xl font-bold mb-1">
          {isConnected ? 'Receiving Audio...' : 'Reconnecting...'}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          Sync Offset: {offset > 0 ? `+${offset}` : offset} ms
        </p>

        <div className="space-y-4">
          <label className="flex text-sm font-medium items-center justify-between">
            <span className="flex items-center gap-2"><Volume2 className="w-4 h-4"/> Local Volume</span>
            <span>{Math.round(volume * 100)}%</span>
          </label>
          <input 
            type="range" 
            min="0" max="1" step="0.01" 
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
    </div>
  );
}
