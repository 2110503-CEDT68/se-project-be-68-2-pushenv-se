import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { swaggerSpec } from "../src/utils/swagger.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(currentDirectory, "../openapi.yaml");

await writeFile(outputPath, `${JSON.stringify(swaggerSpec, null, 2)}\n`, "utf8");

