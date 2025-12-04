import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { createSpinner } from "./spinner";

export interface ExecuteCommandOptions {
  cwd?: string;
  stdio?: "inherit" | "ignore" | "pipe" | any[];
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
