import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { createSpinner } from "./spinner";
import {
  ExecuteCommandOptions,
  PackageManager,
  EnvVariable,
  CreateEnvOptions,
} from "../types";

export function getPackageExecutor(pm: PackageManager): string {
  const executors: Record<PackageManager, string> = {
    npm: "npx -y",
    yarn: "yarn dlx",
    pnpm: "pnpx",
    bun: "bunx",
  };
  return executors[pm];
}

export function getAddCommand(pm: PackageManager, dev = false): string {
  const devFlag = dev ? " -D" : "";
  const commands: Record<PackageManager, string> = {
    npm: `npm install${dev ? " --save-dev" : ""}`,
    yarn: `yarn add${dev ? " -D" : ""}`,
    pnpm: `pnpm add${devFlag}`,
    bun: `bun add${dev ? " -d" : ""}`,
  };
  return commands[pm];
}

export function detectPackageManager(): PackageManager {
  const cwd = process.cwd();

  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
    return "yarn";
  }
  if (fs.existsSync(path.join(cwd, "bun.lockb"))) {
    return "bun";
  }
  if (fs.existsSync(path.join(cwd, "package-lock.json"))) {
    return "npm";
  }
  return "pnpm";
}

export function executeCommand(
  command: string,
  options: ExecuteCommandOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [], {
      cwd: options.cwd,
      stdio: options.stdio || "inherit",
      shell: true,
    });

    let stderr = "";

    if (child.stderr) {
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });
    }

    child.on("error", (error: Error) => {
      reject(error);
    });

    child.on("close", (code: number) => {
      if (code !== 0) {
        const errorMessage = stderr
          ? `Command failed with exit code ${code}: ${stderr}`
          : `Command failed with exit code ${code}`;
        reject(new Error(errorMessage));
      } else {
        resolve();
      }
    });
  });
}

export function writeToFile(filePath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function ensureProjectInitialized() {
  if (!fs.existsSync(path.join(path.join(process.cwd(), ".nuxt")))) {
    createSpinner("").fail(
      "❌ No Nuxt project detected. Please run `create-nuxt-hasura-cli init <project-name>` first."
    );
    process.exit(1);
  }
}

export async function addScriptToPackageJson(scripts: Record<string, string>) {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    createSpinner("").fail("❌ No package.json file found.");
    process.exit(1);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  packageJson.scripts = { ...packageJson.scripts, ...scripts };

  await writeToFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

/**
 * Creates an env file with the given variables
 * @param variables - Array of environment variables to add
 * @param options - Configuration options
 * @returns Object with created flag and path
 */
export function createEnvFile(
  variables: EnvVariable[],
  options: CreateEnvOptions = {}
): { created: boolean; path: string } {
  const filename = options.filename || ".env.example";
  const filePath = path.join(process.cwd(), filename);

  if (fs.existsSync(filePath) && !options.overwrite) {
    return { created: false, path: filePath };
  }

  let content = "";
  if (options.header) {
    content += `# ${options.header}\n`;
  }

  for (const variable of variables) {
    if (variable.comment) {
      content += `# ${variable.comment}\n`;
    }
    content += `${variable.key}=${variable.value}\n`;
  }

  fs.writeFileSync(filePath, content);
  return { created: true, path: filePath };
}

/**
 * Appends variables to an existing env file or creates one if it doesn't exist
 * @param variables - Array of environment variables to add
 * @param options - Configuration options
 * @returns Object with action taken and path
 */
export function appendToEnvFile(
  variables: EnvVariable[],
  options: CreateEnvOptions = {}
): { action: "created" | "appended" | "skipped"; path: string } {
  const filename = options.filename || ".env.example";
  const filePath = path.join(process.cwd(), filename);

  if (!fs.existsSync(filePath)) {
    createEnvFile(variables, options);
    return { action: "created", path: filePath };
  }

  const existingContent = fs.readFileSync(filePath, "utf-8");

  // Filter out variables that already exist
  const newVariables = variables.filter(
    (v) => !existingContent.includes(`${v.key}=`)
  );

  if (newVariables.length === 0) {
    return { action: "skipped", path: filePath };
  }

  let content = existingContent.trim() + "\n\n";
  if (options.header) {
    content += `# ${options.header}\n`;
  }

  for (const variable of newVariables) {
    if (variable.comment) {
      content += `# ${variable.comment}\n`;
    }
    content += `${variable.key}=${variable.value}\n`;
  }

  fs.writeFileSync(filePath, content);
  return { action: "appended", path: filePath };
}

/**
 * Detects the Nuxt version from package.json
 * @returns Major version number (3 or 4) or null if Nuxt is not found
 */
export function detectNuxtVersion(): number | null {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const nuxtVersion =
    packageJson.dependencies?.nuxt || packageJson.devDependencies?.nuxt;

  if (!nuxtVersion) {
    return null;
  }

  // Extract major version from version string (e.g., "^4.0.0" -> 4)
  const match = nuxtVersion.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Ensures a directory exists, creating it recursively if needed
 * @param dirPath - Path to the directory
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
