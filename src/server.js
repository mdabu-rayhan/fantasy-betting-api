import { createApp } from './app.js';

const { app, config } = createApp();

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port} (${config.appEnv})`);
});
