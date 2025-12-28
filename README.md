# Gostman

<div align="center">
  <img src="gostman-gui/frontend/src/assets/logo.jpg" alt="Gostman Logo" width="120" height="120" style="border-radius: 20px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);">
  
  <h1 style="margin-top: 20px;">The HTTP Client For the Go Era</h1>
  
  <p style="font-size: 1.2em; color: #666;">
    Native, lightweight, and blazing fast. The developer's choice for API testing.
  </p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  ![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
</div>

<br>

![Gostman Preview](screenshots/landing_page.png)

## Overview

Gostman is a modern, cross-platform HTTP client built with **Wails** (Go + React). It combines the performance of a native Go backend with the beautiful, reactive UI of modern web technologies.

Why use generic, bloated tools when you can use a client designed for speed and simplicity?

## Features

- ⚡ **Lightning Fast**: Built with Go for instant startup and blazing-fast response times.
- 🎨 **Beautiful UI**: Modern glassmorphic design with smooth animations and dark mode.
- 🔒 **Local & Private**: All data stays on your machine. No cloud sync, no tracking, no accounts.
- 📂 **Collections**: Organize your requests into collections for easy access.
- 🔄 **Environment Variables**: Manage multiple environments (Dev, Staging, Prod) with dynamic variable support.
- ⌨️ **Keyboard Shortcuts**: Power user shortcuts for rapid API testing workflows.
- 🖥️ **Cross-Platform**: Native executables for macOS, Windows, and Linux.

## Installation

### Download Pre-built Binaries

Visit the [Releases](https://github.com/krockxz/gostman/releases) page to download the latest version:

| OS | Format | Download |
|----|--------|----------|
| **macOS** | `.zip` | [Universal Binary (Intel + Apple Silicon)](https://github.com/krockxz/gostman/releases/latest/download/Gostman-darwin-universal.zip) |
| **Windows**| `.exe` | [64-bit Installer](https://github.com/krockxz/gostman/releases/latest/download/Gostman-windows-amd64.exe) |


### Build from Source

**Prerequisites:**
- Go 1.23+
- Node.js 20+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

```bash
# 1. Install Wails
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 2. Clone the repository
git clone https://github.com/krockxz/gostman.git
cd gostman/gostman-gui

# 3. Build the application
wails build
```

Run the binary from `build/bin/`.

## Development

### Live Development (Hot Reload)

Run the application in development mode. This starts both the Go backend and the Vite frontend server.

```bash
cd gostman-gui
wails dev
```

### Web Version

Gostman also runs as a pure web application (with some limitations like CORS, handled via proxy in production).

```bash
cd gostman-gui/frontend
npm run dev:web
```

## Project Structure

```bash
gostman/
├── gostman-gui/     # Main Application
│   ├── main.go      # Application entry point
│   ├── app.go       # Wails app context and backend methods
│   ├── wails.json   # Wails project configuration
│   ├── frontend/    # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── App.jsx       # Desktop app component
│   │   │   ├── WebApp.jsx    # Web app component (with landing page)
│   │   │   ├── components/   # UI Components
│   │   │   └── lib/          # Utilities (API, Storage, etc.)
│   └── build/       # Build output
└── README.md        # Project Documentation
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
