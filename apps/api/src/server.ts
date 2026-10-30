import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` HakPekerja.AI Public API Gateway`);
  console.log(` Port: ${config.port}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Internal RAG URL: ${config.ragServiceUrl}`);
  console.log(` Endpoint: http://localhost:${config.port}/api/v1/health`);
  console.log(`====================================================`);
});

