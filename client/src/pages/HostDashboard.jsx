import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Activity, Users, Settings, Play, Square, Volume2 } from 'lucide-react';

export default function HostDashboard() {
  const [ip, setIp] = useState('localhost');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [offset, setOffset] = useState(0);
  const ws = useRef(null);

  useEffect(() => {
    fetch('/api/info').then(r => r.json()).then(data => {
      setIp(data.ip);
    }).catch(e => console.error(e));

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        ws.current.send(JSON.stringify({ type: 'register_host' }));
        ws.current.send(JSON.stringify({ type: 'get_devices' }));
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'devices_list') {
            setDevices(data.devices);
            if (data.devices.length > 0 && !selectedDevice) {
              // Try to find a virtual cable by default, else first device
              const vbCable = data.devices.find(d => d.toLowerCase().includes('cable'));
              setSelectedDevice(vbCable || data.devices[0]);
            }
          } else if (data.type === 'stats') {
            setListeners(data.listenersCount);
            setIsStreaming(data.isStreaming);
            if (data.currentDevice) setSelectedDevice(data.currentDevice);
          }
        } catch (e) {
          // Ignore binary/other messages
        }
      };

      ws.current.onclose = () => {
        setTimeout(connectWebSocket, 2000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const handleStartStop = () => {
    if (isStreaming) {
      ws.current.send(JSON.stringify({ type: 'stop_stream' }));
    } else {
      if (!selectedDevice) return alert('Please select an audio device');
      ws.current.send(JSON.stringify({ type: 'start_stream', device: selectedDevice }));
    }
  };

  const handleOffsetChange = (e) => {
    const val = parseInt(e.target.value);
    setOffset(val);
    ws.current.send(JSON.stringify({ type: 'set_offset', offset: val }));
  };

  const joinUrl = `http://${ip}:${window.location.port || 3000}`;

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Activity className="text-primary h-8 w-8" />
          LocalCast Audio Host
        </h1>
        <div className="flex items-center gap-4 bg-secondary/50 px-4 py-2 rounded-full border border-border">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">{listeners} Listener{listeners !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <h2 className="font-medium text-lg mb-4">Scan to Join</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <QRCodeSVG value={joinUrl} size={180} />
            </div>
            <p className="text-sm text-muted-foreground break-all">{joinUrl}</p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Audio Input Device
              </label>
              <select 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                disabled={isStreaming}
              >
                {devices.length === 0 ? <option>Loading devices...</option> : null}
                {devices.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                For system audio loopback, you must select "Stereo Mix" or use a Virtual Audio Cable (e.g., VB-Cable).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex justify-between">
                <span className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> Sync Offset</span>
                <span>{offset > 0 ? `+${offset}` : offset} ms</span>
              </label>
              <input 
                type="range" 
                min="-500" max="500" step="10" 
                value={offset} 
                onChange={handleOffsetChange}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Adjust if clients hear audio too early or too late relative to the video on this laptop.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <button 
                onClick={handleStartStop}
                className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 transition-colors ${
                  isStreaming 
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                {isStreaming ? (
                  <><Square className="w-5 h-5" fill="currentColor" /> Stop Streaming</>
                ) : (
                  <><Play className="w-5 h-5" fill="currentColor" /> Start Streaming</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
