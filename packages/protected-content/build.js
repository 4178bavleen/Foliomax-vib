/**
 * Build script for @yourorg/protected-content
 * Generates both ESM and CJS outputs with full TypeScript declaration maps.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const tscBin = path.resolve(rootDir, '../../dashboard/node_modules/typescript/bin/tsc');

console.log('[build] Compiling TypeScript (ESM & Declarations)...');
execSync(`node "${tscBin}" --project "${path.join(rootDir, 'tsconfig.json')}"`, {
  stdio: 'inherit',
  cwd: rootDir,
});

console.log('[build] Compiling CommonJS bundle...');
const tempTsConfigCjs = path.join(rootDir, 'tsconfig.cjs.json');
fs.writeFileSync(
  tempTsConfigCjs,
  JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        module: 'CommonJS',
        outDir: './dist/cjs',
        declaration: false,
        declarationMap: false,
        sourceMap: false,
      },
    },
    null,
    2
  )
);

try {
  execSync(`node "${tscBin}" --project "${tempTsConfigCjs}"`, {
    stdio: 'inherit',
    cwd: rootDir,
  });

  // Copy or create dist/index.cjs from dist/cjs/index.js
  const cjsIndexPath = path.join(rootDir, 'dist/cjs/index.js');
  if (fs.existsSync(cjsIndexPath)) {
    // bundle or copy cjs folder contents
    fs.copyFileSync(cjsIndexPath, path.join(rootDir, 'dist/index.cjs'));

    // Also copy all cjs helper modules to dist/ with .cjs extension
    const cjsFiles = fs.readdirSync(path.join(rootDir, 'dist/cjs'));
    for (const f of cjsFiles) {
      if (f.endsWith('.js')) {
        const base = f.slice(0, -3);
        const content = fs.readFileSync(path.join(rootDir, 'dist/cjs', f), 'utf8');
        // Update relative requires from .js to .cjs if needed
        const fixedContent = content.replace(/require\(["']\.\/([^"']+)["']\)/g, 'require("./$1.cjs")');
        fs.writeFileSync(path.join(rootDir, 'dist', `${base}.cjs`), fixedContent);
      }
    }
    // Clean up temporary cjs folder
    fs.rmSync(path.join(rootDir, 'dist/cjs'), { recursive: true, force: true });
  }
} finally {
  if (fs.existsSync(tempTsConfigCjs)) {
    fs.unlinkSync(tempTsConfigCjs);
  }
}

console.log('[build] Build completed successfully.');
