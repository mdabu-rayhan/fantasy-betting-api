const LEVELS = { DEBUG: 10, INFO: 20, WARNING: 30, ERROR: 40 };

export function createLogger(level = 'INFO') {
  const threshold = LEVELS[level.toUpperCase()] ?? LEVELS.INFO;

  function write(lvl, scope, message) {
    if (LEVELS[lvl] < threshold) return;
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${lvl} ${scope} ${message}`);
  }

  return {
    debug: (scope, msg) => write('DEBUG', scope, msg),
    info: (scope, msg) => write('INFO', scope, msg),
    warn: (scope, msg) => write('WARNING', scope, msg),
    error: (scope, msg) => write('ERROR', scope, msg),
  };
}
