import 'dotenv/config';

export function loadConfig(overrides = {}) {
  const port = Number(overrides.port ?? overrides.PORT ?? process.env.PORT ?? 3000);
  const appEnv = overrides.appEnv ?? overrides.APP_ENV ?? process.env.APP_ENV ?? 'development';
  const logLevel = overrides.logLevel ?? overrides.LOG_LEVEL ?? process.env.LOG_LEVEL ?? 'INFO';
  const lockCutoffMinutes = Number(
    overrides.lockCutoffMinutes ?? overrides.LOCK_CUTOFF_MINUTES ?? process.env.LOCK_CUTOFF_MINUTES ?? 15
  );

  if (Number.isNaN(port) || Number.isNaN(lockCutoffMinutes)) {
    throw new Error('Invalid numeric environment variable in configuration');
  }

  return { port, appEnv, logLevel, lockCutoffMinutes };
}
