# Templately

A simple, transparent markdown-to-static-HTML generator.

## How it works

1. **Source**: Place your markdown files in the `content/` directory
2. **Build**: Run `npm run build` to generate pretty-printed HTML files
3. **Output**: Static HTML files are created in `dist/`
4. **Watch**: Run `npm run dev` to auto-rebuild on changes

## Directory structure

```
templately/
├── content/              # Your markdown files go here
│   ├── index.md
│   ├── about.md
│   └── blog/
│       └── post-1.md
├── src/                   # Source template, Sass, and JavaScript
│   ├── template.html
│   ├── styles/
│   │   └── styles.scss
│   └── script.js
├── dist/                 # Generated HTML and assets
│   └── assets/
│       └── styles.css    # Compiled from src/styles/styles.scss
├── build.js             # The build script (easy to understand)
└── package.json
```

## Setup

```bash
npm install
npm run build
```

## Creating content

1. Create markdown files in the `content/` directory
2. The first `# Heading` becomes the page title
3. Run `npm run build` to generate HTML files

## Customization

- **Template**: Edit `src/template.html` to change the HTML structure
- **Styling**: Add Sass files to `src/styles/`
- **JavaScript**: Add scripts to `src/script.js`
- **Build logic**: Edit `build.js` - it's straightforward JavaScript

The build compiles Sass files from `src/styles/` into `dist/assets/` and copies `src/script.js` into `dist/`.

## Features

- ✓ GitHub Flavored Markdown, including tables, task lists, strikethrough, and autolinks
- ✓ Simple and transparent
- ✓ Easy to understand and modify
- ✓ Watch mode for development (`npm run dev`)
- ✓ Subdirectory support (nested content)
- ✓ Automatic title extraction
- ✓ No complex configuration
