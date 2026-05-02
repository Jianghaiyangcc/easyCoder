const { execSync } = require('child_process');

// Apply patches to node_modules
require('../patches/fix-pglite-prisma-bytes.cjs');
require('../patches/fix-livekit-room-reuse.cjs');

if (process.env.SKIP_EASYCODER_WIRE_BUILD === '1') {
  console.log('[postinstall] SKIP_EASYCODER_WIRE_BUILD=1, skipping @easycoder/wire build');
  process.exit(0);
}

execSync('pnpm --filter @easycoder/wire build', {
  stdio: 'inherit',
});
