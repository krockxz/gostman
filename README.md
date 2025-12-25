# Gostman

A modern HTTP client for developers - available as both a terminal-based CLI tool and a beautiful GUI desktop application.

## Versions

### 🖥️ CLI Version (Terminal)
A terminal-based API client built with Bubble Tea for creating, sending, and managing HTTP requests.

![gostman](https://github.com/user-attachments/assets/98ad0be6-479e-432f-8794-bd495a401872)

**Features:**
- Create and send HTTP requests (GET, POST, PUT, DELETE, etc.)
- Save, load, and manage requests
- Edit and delete saved requests easily
- Dynamic UI with status messages and detailed responses

**Install:**
```bash
go install github.com/krockxz/gostman@latest
```

**Usage:**
```bash
gostman
```

**Keyboard Shortcuts:**
- `Ctrl + C`: Quit the application
- `Tab`: Move around
- `Ctrl + Arrow Keys`: Change Tabs (Body/Param/Header)
- `Enter`: Send a request
- `Ctrl + S`: Save the current request
- `Ctrl + E`: Open Environment Variables page
- `Ctrl + D`: Open Dashboard
- `Ctrl + H`: Open Help page

### 🖥️ GUI Version (Desktop)
A beautiful, modern GUI desktop application built with Wails and React.

**Features:**
- Beautiful glassmorphic UI design
- Real-time HTTP request/response handling
- Collections management
- Environment variables support
- Request history
- Dark mode theme
- Cross-platform (macOS, Windows, Linux)

**Download:**
Visit the [Releases](https://github.com/krockxz/gostman/releases) page to download the latest version for your platform:
- macOS: Universal Binary (Intel + Apple Silicon)
- Windows: 64-bit Installer
- Linux: AppImage (Universal)

**Build from source:**
```bash
cd gostman-gui
go install github.com/wailsapp/wails/v2/cmd/wails@latest
wails build
```

### 🌐 Web Version
Try Gostman in your browser at [gostman.dev](https://gostman.dev) (coming soon).

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to improve this project.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [GitHub Repository](https://github.com/krockxz/gostman)
- [Issue Tracker](https://github.com/krockxz/gostman/issues)
- [Releases](https://github.com/krockxz/gostman/releases)
