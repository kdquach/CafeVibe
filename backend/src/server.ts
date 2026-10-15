import 'dotenv/config';
import { createApp } from './app.js';
import { EnvValidationError, parseEnv } from './config/env.js';

function main(): void {
  let env;
  try {
    env = parseEnv(process.env);
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error(error.message);
      console.error('\nCopy backend/.env.example to backend/.env and adjust the values.');
      process.exit(1);
    }
    throw error;
  }

  const app = createApp(env);
  app.listen(env.PORT, () => {
    console.log(`CafeVibe API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

main();
