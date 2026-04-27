import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Job Fair backend listening on http://localhost:${env.PORT}`);
  console.log(`Swagger UI available at http://localhost:${env.PORT}/swagger`);
  console.log(`OpenAPI JSON available at http://localhost:${env.PORT}/api/v1/openapi.json`);
});
