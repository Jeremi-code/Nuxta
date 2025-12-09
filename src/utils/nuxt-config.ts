import { loadFile, writeFile, builders } from "magicast";
import * as path from "path";
import * as fs from "fs";
import { createSpinner } from "./spinner";

export async function updateNuxtConfig(
  updateFn: (config: any) => void
): Promise<void> {
  const cwd = process.cwd();
  const possibleConfigs = ["nuxt.config.ts", "nuxt.config.js"];
  let configPath = "";

  for (const config of possibleConfigs) {
    if (fs.existsSync(path.join(cwd, config))) {
      configPath = path.join(cwd, config);
      break;
    }
  }

  if (!configPath) {
    createSpinner("").warn(
      "⚠️ Could not find nuxt.config.ts or nuxt.config.js. Skipping automatic configuration."
    );
    return;
  }

  try {
    const mod = await loadFile(configPath);

    let config = mod.exports.default;
    if (
      config.$type === "function-call" &&
      config.$callee === "defineNuxtConfig"
    ) {
      config = config.$args[0];
    }

    updateFn(config);

    await writeFile(mod, configPath);
  } catch (error) {
    createSpinner("").fail(
      `❌ Failed to update ${path.basename(configPath)}: ${
        (error as Error).message
      }`
    );
  }
}

export async function addNuxtModule(moduleName: string) {
  await updateNuxtConfig((config) => {
    config.modules ||= [];
    if (!config.modules.includes(moduleName)) {
      config.modules.push(moduleName);
    }
  });
}

export async function addApolloConfig() {
  await updateNuxtConfig((config) => {
    config.apollo ||= {};
    config.apollo.clients ||= {};
    config.apollo.clients.default ||= {};
    const isNuxt4 = fs.existsSync(path.join(process.cwd(), "app"));
    const clientPath = isNuxt4
      ? "./app/apollo/apollo.ts"
      : "./apollo/apollo.ts";

    config.apollo.clients.default = clientPath;
  });
}

export async function addRuntimeConfig(
  key: string,
  value: any,
  isPublic: boolean = false,
  isRaw: boolean = false
) {
  await updateNuxtConfig((config) => {
    config.runtimeConfig ||= {};

    const val = isRaw ? builders.raw(value) : value;

    if (isPublic) {
      config.runtimeConfig.public ||= {};
      config.runtimeConfig.public[key] = val;
    } else {
      config.runtimeConfig[key] = val;
    }
  });
}
