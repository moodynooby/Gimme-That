# LinkHarvest – Discover and Download Everything on a Site

## Description
**LinkHarvest** is a powerful browser extension that helps you discover and download every file, image, video, and media item on any website. Simply point it at a page, and LinkHarvest will crawl same-site links to find content you might miss on the page alone.

LinkHarvest's philosophy: **Crawl deep, discover everything, download in one go.** No distractions, just efficient harvesting of web content.

## Links
- [GitHub](https://github.com/moodynooby/Gimme-That)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/gimmethat/)

## Features

### 🌱 Site Harvest (Core Feature)
- **Crawl same-site links** to discover files and media across multiple pages
- **Configurable depth** – control how deep the crawler goes (1-10 levels)
- **File type discovery** – find PDFs, images, videos, archives, and more
- **Smart filtering** – only harvest specific file types you're looking for

### ⬇️ One-Page Download
- **Mass download** all links from a single page
- **Fast filtering** with pattern matching
- **Batch support** for Metalink and Metalink4
- **Export options** – JSON, aria2, Metalink, or plain text

### 🎛️ Download Manager
- **Resume and retry** failed downloads automatically
- **Parallel connections** for faster speeds
- **Progress tracking** with detailed statistics
- **Queue management** with priority controls

### ✨ Modern Interface
- **Clean, intuitive design** that gets out of your way
- **Dark mode support** for comfortable use
- **Native tooltips and sounds** for seamless integration

## Demo / Screenshots

### Popup Menu
![Popup with Harvest Actions](SS/popup-harvest.png)

### Site Harvest in Action
![Select Window with Harvest Section](SS/select-harvest.png)

### Harvest Complete
![Harvest Results Toast](SS/harvest-toast.png)

## Setup

### Requirements
- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) package manager
- [Python 3](https://www.python.org/) ≥ 3.6 (for building release zips)
- [web-ext](https://www.npmjs.com/package/web-ext) (optional, for Firefox development)

### Installation
```bash
# Clone the repository
git clone https://github.com/moodynooby/Gimme-That.git
cd Gimme-That

# Install dependencies
pnpm install
```

### Development
```bash
# Watch for changes and rebuild automatically
pnpm watch

# One-time build
pnpm build
```

### Running in Firefox
```bash
# Requires web-ext installed globally
pnpm webext
```
This uses a separate Firefox profile and automatically reloads the extension on changes.

### Running in Chrome/Chromium
1. Build with `pnpm build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` directory

### Building Release Packages
```bash
# Build for all browsers
python3 util/build.py --mode=release
```
Output files will be in `web-ext-artifacts/`:
- `linkharvest-{version}-fx.zip` – Firefox
- `linkharvest-{version}-crx.zip` – Chrome/Chromium
- `linkharvest-{version}-opr.zip` – Opera

## How It Works

1. **Install LinkHarvest** from your browser's extension store
2. **Navigate to any website** you want to explore
3. **Click the LinkHarvest icon** to open the popup menu
4. **Select "Harvest linked pages"** to start crawling
5. **Review discovered files** in the selection window
6. **Download everything** with one click or use filters to cherry-pick

## Configuration

LinkHarvest lets you customize:
- **Crawl depth** (default: 2 levels)
- **Maximum pages** to check (default: 50)
- **File extensions** to look for (comma-separated)
- **Default save location** with rename masks
- **Connection limits** and retry settings

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Release Notes

### v6.0 – LinkHarvest Rebrand
- **New name: LinkHarvest** – discover and download everything on a site
- **Site Harvest** is now the flagship feature (crawl same-site links)
- **UI reorganization** – harvest actions promoted to top of menu
- **New visual identity** with harvest-themed styling
- **Improved locale support** with harvest-first copy

### v4.14
- Added new crawl feature
- Performance improvements
- Bug fixes

### v2.6
- Faster and lighter performance
- Modernized settings page
- Native tooltips and sounds

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE-gpl.txt](LICENSE-gpl.txt) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/moodynooby/Gimme-That/issues)
- **Discussions**: [GitHub Discussions](https://github.com/moodynooby/Gimme-That/discussions)

---

**LinkHarvest** – *Harvest the web, one link at a time.* 🌱
