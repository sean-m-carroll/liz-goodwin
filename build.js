import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import chokidar from 'chokidar';
import { format } from 'prettier';
import { fileURLToPath } from 'url';
import * as he from 'he';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_DIR = path.join(__dirname, 'content');
const ASSETS_DIR = path.join(__dirname, 'src');
const OUTPUT_DIR = path.join(__dirname, 'dist');
const TEMPLATE_PATH = path.join(ASSETS_DIR, 'template.html');
const ASSET_FILES = ['script.js'];

// marked.use({
//   hooks: {
//     postprocess(html) {
//       // Replaces ’ (U+2019) with its decimal numeric entity
//       return html.replace(/\u2019/g, '&#8217;');
//     }
//   }
// });

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyAssets() {
  for (const file of ASSET_FILES) {
    const sourcePath = path.join(ASSETS_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, outputPath);
    } else if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }
}

// Read template
function getTemplate() {
  if (fs.existsSync(TEMPLATE_PATH)) {
    return fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  }
  // Fallback template
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main>
    {{content}}
  </main>
  <script src="/script.js"></script>
</body>
</html>`;
}

// Extract title from markdown (first h1 or filename)
function extractTitle(content, filename) {
  const match = content.match(/^# (.+)$/m);
  if (match) {
    return match[1];
  }
  return filename.replace(/\.md$/, '').replace(/-/g, ' ');
}

// Convert markdown file to HTML
async function convertMarkdown(inputPath, outputPath) {
  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const filename = path.basename(inputPath);
    const title = extractTitle(content, filename);
    const htmlContent = await marked(content, { gfm: true });
    const htmlContentEncoded = he.encode(htmlContent, {
      allowUnsafeSymbols: true, // Preserves <, >, &, ", ' used by HTML tags
      decimal: true             // Outputs &#8217; instead of hex &#x2019;
    });
    // const htmlContentEncoded = htmlContent.replace(/\u2019/g, '&#8217;');

    const template = getTemplate();
    const html = template
      .replace('{{title}}', title)
      .replace('{{content}}', htmlContentEncoded);
    const formattedHtml = await format(html, { parser: 'html' });

    // Ensure output directory exists
    ensureDir(path.dirname(outputPath));

    fs.writeFileSync(outputPath, formattedHtml, 'utf-8');
    console.log(`✓ Generated: ${path.relative(__dirname, outputPath)}`);
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error.message);
  }
}

// Build all markdown files
async function buildAll() {
  ensureDir(SRC_DIR);
  ensureDir(OUTPUT_DIR);
  copyAssets();

  console.log('Building markdown files...\n');

  const files = fs.readdirSync(SRC_DIR, { recursive: true });
  const markdownFiles = files.filter(file => file.endsWith('.md'));

  if (markdownFiles.length === 0) {
    console.log('No markdown files found in content/ directory.');
    return;
  }

  for (const file of markdownFiles) {
    const inputPath = path.join(SRC_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace(/\.md$/, '.html'));
    await convertMarkdown(inputPath, outputPath);
  }

  console.log(`\n✓ Build complete! Generated ${markdownFiles.length} file(s).`);
}

// Watch mode
function watchMode() {
  console.log('Watching for changes...\n');

  const watcher = chokidar.watch(SRC_DIR, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  });

  watcher.on('change', async (filePath) => {
    if (!filePath.endsWith('.md')) return;
    console.log(`Changed: ${path.relative(__dirname, filePath)}`);
    const outputPath = path.join(OUTPUT_DIR, path.relative(SRC_DIR, filePath).replace(/\.md$/, '.html'));
    await convertMarkdown(filePath, outputPath);
  });

  watcher.on('add', async (filePath) => {
    if (!filePath.endsWith('.md')) return;
    console.log(`Added: ${path.relative(__dirname, filePath)}`);
    const outputPath = path.join(OUTPUT_DIR, path.relative(SRC_DIR, filePath).replace(/\.md$/, '.html'));
    await convertMarkdown(filePath, outputPath);
  });

  watcher.on('unlink', (filePath) => {
    if (!filePath.endsWith('.md')) return;
    const outputPath = path.join(OUTPUT_DIR, path.relative(SRC_DIR, filePath).replace(/\.md$/, '.html'));
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
      console.log(`Deleted: ${path.relative(__dirname, outputPath)}`);
    }
  });

  watcher.on('error', (error) => {
    console.error('Watcher error:', error);
  });
}

// Main
const args = process.argv.slice(2);
if (args.includes('--watch') || args.includes('-w')) {
  buildAll().then(() => watchMode());
} else {
  buildAll();
}
