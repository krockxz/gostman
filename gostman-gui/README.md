# Gostman GUI

A beautiful, modern HTTP client desktop application built with Wails (Go + React).

![Gostman GUI](https://github.com/krockxz/gostman/assets/your-screenshot)

## Features

- **Beautiful UI**: Modern glassmorphic design with smooth animations
- **Real-time HTTP**: Send requests and see responses instantly
- **Collections**: Organize your requests into collections
- **Environment Variables**: Manage different environments for your API testing
- **Request History**: Keep track of your previous requests
- **Dark Mode**: Easy on the eyes with a sleek dark theme
- **Cross-platform**: Works on macOS, Windows, and Linux

## Installation

### Download Pre-built Binaries

Visit the [Releases](https://github.com/krockxz/gostman/releases) page to download the latest version:

- **macOS**: `Gostman-darwin-universal.dmg` (Universal Binary - Intel + Apple Silicon)
- **Windows**: `Gostman-windows-amd64.exe` (64-bit Installer)
- **Linux**: `Gostman-linux-amd64.AppImage` (Universal)

### Build from Source

#### Prerequisites

- Go 1.23+
- Node.js 18+
- Wails CLI

#### Steps

1. Install Wails CLI:
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

2. Clone and build:
```bash
git clone https://github.com/krockxz/gostman.git
cd gostman/gostman-gui
wails build
```

3. Run the application:
```bash
./build/bin/Gostman
```

## Development

### Live Development

Run the application in development mode with hot reload:

```bash
wails dev
```

This will:
- Start the Wails backend
- Launch Vite dev server for the frontend
- Provide hot reload for both Go and React changes

### Frontend Only Development

To work on the frontend UI without the Go backend:

```bash
cd frontend
npm install
npm run dev
```

### Building

Build the frontend for production:
```bash
cd frontend
npm run build
```

This creates a production build in `frontend/dist/` which will be packaged by Wails.

## Web Version

This project also includes a web version with a beautiful landing page. To build the web version:

```bash
cd frontend
npm run build:web
```

The web build will be in `frontend/dist-web/` and can be deployed to any static hosting service.

See [WEB_BUILD.md](frontend/WEB_BUILD.md) for more details on web vs desktop builds.

## Project Structure

```
gostman-gui/
├── main.go          # Application entry point
├── app.go           # Wails app context and backend methods
├── wails.json       # Wails project configuration
├── frontend/        # React frontend
│   ├── src/
│   │   ├── App.jsx       # Desktop app (no landing page)
│   │   ├── WebApp.jsx    # Web app (with landing page)
│   │   ├── main.jsx      # Desktop entry point
│   │   ├── web-main.jsx  # Web entry point
│   │   └── components/   # React components
│   ├── index.html        # Desktop HTML
│   ├── index-web.html    # Web HTML
│   └── vite.config.js    # Vite configuration
└── build/           # Build output
```

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Send request
- `Ctrl/Cmd + S`: Save request
- `Ctrl/Cmd + N`: New request
- `Ctrl/Cmd + W`: Close current tab

## Contributing

We welcome contributions! Please feel free to submit issues or pull requests.

## License

MIT License - see the main [LICENSE](../LICENSE) file for details.

## Links

- [Main Repository](https://github.com/krockxz/gostman)
- [Issue Tracker](https://github.com/krockxz/gostman/issues)
- [Releases](https://github.com/krockxz/gostman/releases)
