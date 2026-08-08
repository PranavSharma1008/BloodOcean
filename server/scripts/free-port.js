const { execSync } = require('child_process');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

try {
  const pids = execSync(`lsof -ti:${PORT} -sTCP:LISTEN`, { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);

  if (pids.length) {
    execSync(`kill -9 ${pids.join(' ')}`);
    console.log(`Freed port ${PORT} (killed process ${pids.join(', ')})`);
  }
} catch (err) {
  // No process listening on the port — nothing to free
}
