const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const ip = require('ip');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.static(path.join(__dirname, 'client/dist')));

let activeFfmpeg = null;
let currentDevice = null;
let listenersCount = 0;

// Helper to broadcast to all clients except the sender (host) if needed
// Actually, we'll just broadcast audio to all clients.
function broadcastAudio(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.isListener) {
      client.send(data);
    }
  });
}

function broadcastStats() {
  const stats = JSON.stringify({
    type: 'stats',
    listenersCount,
    isStreaming: !!activeFfmpeg,
    currentDevice
  });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.isHost) {
      client.send(stats);
    }
  });
}

wss.on('connection', (ws, req) => {
  ws.isListener = false;
  ws.isHost = false;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'register_host') {
        ws.isHost = true;
        broadcastStats();
      } else if (data.type === 'register_listener') {
        if (!ws.isListener) {
          ws.isListener = true;
          listenersCount++;
          broadcastStats();
        }
      } else if (data.type === 'get_devices') {
        // List Windows DirectShow audio devices
        const ls = spawn('ffmpeg', ['-list_devices', 'true', '-f', 'dshow', '-i', 'dummy']);
        let output = '';
        ls.stderr.on('data', (d) => { output += d.toString(); });
        ls.on('close', () => {
          const devices = [];
          const lines = output.split('\n');
          let currentDeviceName = null;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(/\[.*?\]\s+"([^"]+)"\s+\((audio|video)\)/);
            if (match && match[2] === 'audio') {
               devices.push(match[1]);
            }
          }
          ws.send(JSON.stringify({ type: 'devices_list', devices }));
        });
      } else if (data.type === 'start_stream') {
        if (activeFfmpeg) {
          activeFfmpeg.kill('SIGINT');
          activeFfmpeg = null;
        }
        
        currentDevice = data.device;
        console.log(`Starting stream with device: ${currentDevice}`);
        
        activeFfmpeg = spawn('ffmpeg', [
          '-f', 'dshow',
          '-fflags', 'nobuffer',
          '-flags', 'low_delay',
          '-probesize', '32',
          '-analyzeduration', '0',
          '-i', `audio=${currentDevice}`,
          '-ac', '2',             // Stereo
          '-ar', '48000',         // 48kHz
          '-f', 's16le',          // Raw PCM 16-bit little-endian
          '-'                     // Output to stdout
        ]);

        activeFfmpeg.stdout.on('data', (chunk) => {
          broadcastAudio(chunk);
        });

        activeFfmpeg.stderr.on('data', (err) => {
          // ffmpeg logs to stderr
          // console.log(err.toString());
        });

        activeFfmpeg.on('close', () => {
          console.log('Stream stopped');
          activeFfmpeg = null;
          broadcastStats();
        });
        
        broadcastStats();
      } else if (data.type === 'stop_stream') {
        if (activeFfmpeg) {
          activeFfmpeg.kill('SIGINT');
          activeFfmpeg = null;
        }
        currentDevice = null;
        broadcastStats();
      } else if (data.type === 'set_offset') {
        // Forward offset to all listeners
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && client.isListener) {
            client.send(JSON.stringify({ type: 'set_offset', offset: data.offset }));
          }
        });
      }
    } catch (e) {
      // Ignore binary messages from clients if any
    }
  });

  ws.on('close', () => {
    if (ws.isListener) {
      listenersCount = Math.max(0, listenersCount - 1);
      broadcastStats();
    }
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    ip: ip.address(),
    port: 3000
  });
});

// Fallback to React index
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://${ip.address()}:${PORT}`);
  console.log(`Host dashboard accessible at http://localhost:${PORT}/host`);
});
