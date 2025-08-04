const { build } = require('esbuild');
const { execSync } = require('child_process');

const isWatch = process.argv.includes('--watch');

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  sourcemap: true,
  minify: true,
  platform: 'node',
  target: 'node16',
  external: [],
};

// Build CommonJS version
const buildCJS = () => build({
  ...baseConfig,
  outfile: 'dist/index.js',
  format: 'cjs',
});

// Build ESM version
const buildESM = () => build({
  ...baseConfig,
  outfile: 'dist/index.esm.js',
  format: 'esm',
});

// Generate TypeScript declarations
const generateTypes = () => {
  try {
    execSync('npx tsc --emitDeclarationOnly --outDir dist', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to generate TypeScript declarations:', error.message);
  }
};

async function buildAll() {
  try {
    console.log('🔨 Building...');
    
    await Promise.all([
      buildCJS(),
      buildESM(),
    ]);
    
    generateTypes();
    
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

if (isWatch) {
  console.log('👀 Watching for changes...');
  
  // Build once initially
  buildAll();
  
  // Set up file watcher
  const chokidar = require('fs').watch || (() => {
    console.warn('Watch mode requires Node.js 14.14.0 or later');
    return { close: () => {} };
  });
  
  try {
    const watcher = chokidar('src', { recursive: true }, (eventType, filename) => {
      if (filename) {
        console.log(`📝 File changed: ${filename}`);
        buildAll();
      }
    });
    
    process.on('SIGINT', () => {
      watcher.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Watch mode not available, falling back to single build');
    buildAll();
  }
} else {
  buildAll();
}