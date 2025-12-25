# Gostman Frontend Build Instructions

This project has two separate build targets:

## Desktop Version (Wails GUI)
The desktop version is the standard HTTP client tool without the landing page.

### Build for Desktop
```bash
npm run build
```
Output: `dist/` directory - Used by Wails for desktop application packaging

### Run Desktop Dev Server
```bash
npm run dev
```

---

## Web Version
The web version includes the landing page and is meant for deployment as a web application.

### Build for Web
```bash
npm run build:web
```
Output: `dist-web/` directory - Can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.)

### Run Web Dev Server
```bash
npm run dev:web
```
Opens at: http://localhost:3000

---

## File Structure

### Desktop Entry Points
- `src/App.jsx` - Main desktop application (HTTP client only)
- `src/main.jsx` - Desktop entry point
- `index.html` - Desktop HTML template (points to main.jsx)

### Web Entry Points
- `src/WebApp.jsx` - Web application with landing page
- `src/web-main.jsx` - Web entry point
- `index-web.html` - Web HTML template (points to web-main.jsx)

### Shared Components
- `src/components/LandingPage.jsx` - Landing page component (web only)
- `src/components/Sidebar.jsx` - Collections sidebar
- `src/components/RequestBar.jsx` - URL/method input bar
- `src/components/ResponsePanel.jsx` - Response display
- `src/components/ui/` - Reusable UI components

---

## Deployment

### Desktop Application
Built automatically by Wails when running:
```bash
wails build
```

### Web Application
After building with `npm run build:web`, deploy the `dist-web/` directory:

#### Netlify
```bash
npm run build:web
netlify deploy --prod --dir=dist-web
```

#### Vercel
```bash
npm run build:web
vercel --prod dist-web
```

#### GitHub Pages
```bash
npm run build:web
# Push dist-web/ to gh-pages branch
```

---

## Key Differences

| Feature | Desktop (Wails) | Web |
|---------|----------------|-----|
| Landing Page | ❌ No | ✅ Yes |
| Native File Access | ✅ Yes | ❌ No |
| System Tray | ✅ Yes | ❌ No |
| Offline Capable | ✅ Yes | ⚠️ Limited |
| CORS Restrictions | ✅ None | ⚠️ Applies |
| Distribution | Binary downloads | URL/hosting |

---

## Environment-Specific Features

### Desktop Version Features
- Direct filesystem access for saving/loading requests
- No CORS restrictions (bypasses browser security)
- Native OS integration (menus, shortcuts, file dialogs)
- Faster performance (native code)

### Web Version Features
- Landing page with product information
- No installation required
- Accessible from any device with a browser
- Easy sharing via URL
- Subject to browser CORS policies
