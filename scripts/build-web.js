// Builds the website into web-build/ ready for Netlify (or any static host).
//   npm run build:web
//
// Why the extra steps: Expo puts icon fonts and images under deep folders like
//   assets/node_modules/@expo/vector-icons/build/vendor/.../Fonts/
// Netlify's drag-and-drop deploy silently skips folders like node_modules, "@..."
// and build/, which breaks every icon. So we move every asset into one flat
// folder, assets/f/, and update the links to point there. File names already
// contain a unique hash, so nothing collides.
// We also add a _redirects file so links like /courts or /game/123 work on refresh.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', 'web-build');
const nested = path.join(out, 'assets', 'node_modules');
const flat = path.join(out, 'assets', 'f');

fs.rmSync(out, { recursive: true, force: true });
execSync(`npx expo export --platform web --clear --output-dir "${out}"`, {
  stdio: 'inherit',
  shell: true,
});

// 1. Move every file under assets/node_modules/ into assets/f/.
const moves = []; // [oldUrl, newUrl]
if (fs.existsSync(nested)) {
  fs.mkdirSync(flat, { recursive: true });
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
        continue;
      }
      const dest = path.join(flat, entry.name);
      if (fs.existsSync(dest)) {
        throw new Error(`Two assets share the name ${entry.name}; can't flatten.`);
      }
      fs.renameSync(p, dest);
      const rel = path.relative(nested, p).split(path.sep).join('/');
      moves.push([`/assets/node_modules/${rel}`, `/assets/f/${entry.name}`]);
    }
  })(nested);
  fs.rmSync(nested, { recursive: true, force: true });
}

// 2. Point the app's links at the new locations.
let rewritten = 0;
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(js|css|html|json)$/.test(entry.name)) {
      let text = fs.readFileSync(p, 'utf8');
      if (!text.includes('/assets/node_modules/')) continue;
      for (const [from, to] of moves) text = text.split(from).join(to);
      fs.writeFileSync(p, text);
      rewritten++;
      if (text.includes('/assets/node_modules/')) {
        console.warn(`Warning: ${entry.name} still mentions /assets/node_modules/`);
      }
    }
  }
})(out);

fs.writeFileSync(path.join(out, '_redirects'), '/*    /index.html   200\n');

console.log(
  `\nWebsite ready in web-build/ (${moves.length} assets moved, ${rewritten} file(s) updated).` +
    ' Drag that folder onto Netlify.',
);
