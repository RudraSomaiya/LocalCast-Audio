# LocalCast Audio

LocalCast Audio is a zero-cost, ultra-low-latency local Wi-Fi audio streaming application. It allows a host Windows machine to stream its system audio over a local network (Wi-Fi or Hotspot) to multiple mobile clients directly via their web browsers—no app installation required.

This is the perfect solution for hosting movie nights where the host plays the video on a laptop, and friends listen to perfectly synced audio on their own phones via Bluetooth or wired headphones.

## Features

- **Zero Data Usage**: Operates entirely offline on your local network (LAN or Mobile Hotspot).
- **Ultra-Low Latency**: Uses raw PCM (s16le) over WebSockets and the Web Audio API to achieve <50ms base latency.
- **Auto Device Discovery**: Automatically detects available DirectShow audio devices on the host machine.
- **Host Dashboard**: Built with React and Tailwind CSS. Features live listener counts, QR code generation, and stream controls.
- **Client Web App**: Lightweight mobile interface with Wake-Lock API integration to prevent screens from sleeping during the movie.

## Architecture

- **Backend**: Node.js, Express, WebSockets (`ws`).
- **Audio Capture**: FFmpeg using the `dshow` driver (with ultra-low latency flags).
- **Frontend**: React, Vite, Tailwind CSS v4.

## Setup Instructions

### 1. Prerequisites (Windows)
Because Windows does not natively allow command-line tools to capture speaker loopback output directly, you must use a virtual audio driver.

1. Download and install **[VB-CABLE Virtual Audio Device](https://vb-audio.com/Cable/)** (Free).
2. Reboot your PC if requested.
3. Open **Windows Sound Settings** (Control Panel -> Sound):
   - Set **"CABLE Input"** as your **Default Playback Device**.
   - Go to the **Recording** tab, find **"CABLE Output"**, right-click > **Properties** > **Listen**.
   - Check **"Listen to this device"** and select your physical laptop headphones from the dropdown. This routes audio to the virtual cable while still letting you hear it.
4. Ensure **[FFmpeg](https://ffmpeg.org/)** is installed and added to your system `PATH`.

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/localcast-audio.git
cd localcast-audio

# Install backend dependencies
npm install

# Install and build frontend dependencies
cd client
npm install
npm run build
cd ..
```

### 3. Usage

Start the server:

```bash
npm start
```

1. Open your browser to the URL printed in the terminal (e.g., `http://localhost:3000/host`).
2. Have your friends connect to the same Wi-Fi network (or your laptop's Mobile Hotspot for the absolute lowest latency) and scan the QR code.
3. Select "CABLE Output" from the audio device dropdown and click **Start Streaming**.
4. Your friends tap **Join Audio** on their phones.

## Syncing Audio (Bluetooth Delay)

Standard Bluetooth headphones inherently introduce 150-250ms of audio delay. Since it is physically impossible to send audio faster than the network and Bluetooth hardware allow, the best way to achieve perfect lip-sync is to **delay your video playback** to match the audio.

- **VLC Media Player**: Press `J` or `K` while watching to adjust the Audio Desynchronization.
- **Web Browsers**: Use a free extension like [Global Speed](https://chrome.google.com/webstore/detail/global-speed/jpbjckjhlbgddigkcpokngfkbfekimdn) to delay the video.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
