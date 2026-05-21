import { build } from 'esbuild';
import { readdirSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(fileURLToPath(import.meta.url), '..', '..');
const srcDir = join(rootDir, 'src', 'handlers');
const distDir = join(rootDir, 'dist');

// Clean output directory
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

const handlerDirs = readdirSync(srcDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name);

await Promise.all(
  handlerDirs.map(lambdaName => {
    const entryPoint = join(srcDir, lambdaName, 'handler.ts');
    const outfile = join(distDir, `${lambdaName}.mjs`);

    console.log(`Building handlers/${lambdaName}`);
    return build({
      entryPoints: [entryPoint],
      bundle: true,
      minify: true,
      sourcemap: true,
      platform: 'node',
      target: 'node24',
      format: 'esm',
      mainFields: ['module', 'main'],
      outfile,
      logLevel: 'warning',
      // pg-native alternatives that are optional / non-node
      external: ['better-sqlite3', 'better-mysql2', 'mysql*', 'oracledb', 'pg-query-stream', 'sqlite3', 'tedious'],
      // Ensure AWS SDK v3 tree-shaking works properly
      treeShaking: true,
    });
  }),
);

console.log('All handlers built successfully');
