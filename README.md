# LocalCast Audio

[![GitHub stars](https://img.shields.io/github/stars/RudraSomaiya/LocalCast-Audio?style=social)](https://github.com/RudraSomaiya/LocalCast-Audio/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/RudraSomaiya/LocalCast-Audio?style=social)](https://github.com/RudraSomaiya/LocalCast-Audio/network/members)
[![GitHub issues](https://img.shields.io/github/issues/RudraSomaiya/LocalCast-Audio)](https://github.com/RudraSomaiya/LocalCast-Audio/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


LocalCast Audio is a free, low-latency audio streaming app for a local Wi-Fi network. A Windows host streams its system audio over Wi-Fi or a hotspot to any number of phones, which play it straight from the browser, with no app to install.

I built it for movie nights: the host plays the video on a laptop, and everyone listens on their own phone through Bluetooth or wired headphones.

## Features

- Uses no mobile data, because everything stays on your local network (LAN or mobile hotspot).
- Streams raw PCM (s16le) over WebSockets into the Web Audio API, for under 50 ms of base latency.
- Finds the host machine's DirectShow audio devices automatically.
- A host dashboard built with React and Tailwind CSS shows the live listener count and a QR code for joining, and has the stream controls.
- The lightweight mobile client uses the Wake Lock API so phone screens don't go to sleep halfway through the movie.

## Architecture

| Part | Built with |
|---|---|
| Backend | Node.js, Express, WebSockets (`ws`) |
| Audio capture | FFmpeg with the `dshow` driver and low-latency flags |
| Frontend | React, Vite, Tailwind CSS v4 |

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
git clone https://github.com/RudraSomaiya/LocalCast-Audio.git
cd LocalCast-Audio

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

Standard Bluetooth headphones inherently introduce 150-250ms of audio delay. Since it is physically impossible to send audio faster than the network and Bluetooth hardware allow, the practical fix is to **delay your video playback** to match the audio.

- **VLC Media Player**: Press `J` or `K` while watching to adjust the Audio Desynchronization.
- **Web Browsers**: Use a free extension like [Global Speed](https://chrome.google.com/webstore/detail/global-speed/jpbjckjhlbgddigkcpokngfkbfekimdn) to delay the video.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

Made by Rudra Somaiya.

[![GitHub][badge-github]][link-github]
[![LinkedIn][badge-linkedin]][link-linkedin]

[badge-github]: https://img.shields.io/badge/GitHub-RudraSomaiya-181717?style=for-the-badge&logo=github&logoColor=white
[badge-linkedin]: https://img.shields.io/badge/LinkedIn-Rudra_Somaiya-0A66C2?style=for-the-badge&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTIwLjQ1IDIwLjQ1aC0zLjU2di01LjU3YzAtMS4zMy0uMDItMy4wNC0xLjg1LTMuMDQtMS44NSAwLTIuMTQgMS40NS0yLjE0IDIuOTR2NS42N0g5LjM1VjloMy40MXYxLjU2aC4wNWMuNDgtLjkgMS42NC0xLjg1IDMuMzctMS44NSAzLjYgMCA0LjI3IDIuMzcgNC4yNyA1LjQ2djYuMjh6TTUuMzQgNy40M2EyLjA2IDIuMDYgMCAxIDEgMC00LjEyIDIuMDYgMi4wNiAwIDAgMSAwIDQuMTJ6TTcuMTIgMjAuNDVIMy41NlY5aDMuNTZ2MTEuNDV6TTIyLjIyIDBIMS43N0MuNzkgMCAwIC43NyAwIDEuNzN2MjAuNTRDMCAyMy4yMy43OSAyNCAxLjc3IDI0aDIwLjQ1Yy45OCAwIDEuNzgtLjc3IDEuNzgtMS43M1YxLjczQzI0IC43NyAyMy4yIDAgMjIuMjIgMHoiLz48L3N2Zz4=
[link-github]: https://github.com/RudraSomaiya
[link-linkedin]: https://www.linkedin.com/in/rudra-somaiya/
