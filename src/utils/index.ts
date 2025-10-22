import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { createSpinner } from "./spinner";

export function executeCommand(command: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        createSpinner("").fail(`stderr: ${stderr}`);
      }
      resolve(stdout);
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