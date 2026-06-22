/**
 * Replay harness runner — bundles src/engine/replay-harness.ts with esbuild
 * (bundled with vite, no extra deps) and runs it with node.
 *
 * Usage: node scripts/run-replay.mjs [iterations_per_combo]
 *
 * @param {string|undefined} argv[2] — iterations per combo (default 5000)
 */
import { build } from 'esbuild';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const entry = resolve(root, 'src/engine/replay-harness.ts');

// Create a unique temp directory (random suffix) to avoid predictable-path
// symlink/TOTCTOU attacks flagged by CodeQL's "Insecure temporary file" query.
const tmpDir = mkdtempSync(join(tmpdir(), 'wp-replay-'));
const outfile = resolve(tmpDir, 'harness.mjs');

const result = await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outfile,
  write: false,
  logLevel: 'warning',
});

const code = result.outputFiles[0].text;
writeFileSync(outfile, code);

try {
  const args = process.argv.slice(2);
  const res = spawnSync('node', [outfile, ...args], { stdio: 'inherit', cwd: root });
  process.exit(res.status ?? 0);
} finally {
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}
