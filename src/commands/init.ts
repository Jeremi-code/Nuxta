import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { createSpinner } from "../utils/spinner";
import { executeCommand } from "../utils";

type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export const initCommand = new Command()
  .name("init")
  .description("Initialize a new Nuxt.js project.")
  .argument("<project-name>", "Name of the Nuxt.js project")
  .option("--no-git", "Skip git initialization")
  .action(async (projectName: string, options: { git: boolean }) => {
    // Ask for package manager
    const { packageManager } = await inquirer.prompt<{
      packageManager: PackageManager;
    }>([
      {
        type: "list",
        name: "packageManager",
        message: "Select a package manager:",
        choices: [
          { name: "npm", value: "npm" },
          { name: "yarn", value: "yarn" },
          { name: "pnpm", value: "pnpm" },
          { name: "bun", value: "bun" },
        ],
      },
    ]);

    // Initialize Nuxt project
    const spinner = createSpinner(`Creating Nuxt project: ${projectName}...`);
    spinner.stop();
    try {
      await executeCommand(
        `npx -y giget@latest gh:nuxt/starter#v3 ${projectName}`,
        {
          stdio: "pipe",
        }
      );
      spinner.succeed(`Nuxt project '${projectName}' created.`);
    } catch (error) {
      spinner.fail(
        `Failed to create Nuxt project: ${(error as Error).message}`
      );
      process.exit(1);
    }

    // Install dependencies
    const installSpinner = createSpinner("Installing dependencies...");

    try {
      await executeCommand(`${packageManager} install`, {
        cwd: projectName,
        stdio: "pipe",
      });
      installSpinner.succeed("Dependencies installed.");
    } catch (error) {
      installSpinner.fail(
        `Failed to install dependencies: ${(error as Error).message}`
      );
      process.exit(1);
    }

    // Initialize git (unless --no-git)
    if (options.git) {
      const gitSpinner = createSpinner("Initializing git repository...");

      try {
        await executeCommand("git init", {
          cwd: projectName,
          stdio: "pipe",
        });
        gitSpinner.succeed("Git repository initialized.");
      } catch (error) {
        gitSpinner.fail(
          `Failed to initialize git: ${(error as Error).message}`
        );
      }
    }

    console.log();
    console.log(chalk.green("✔ Project setup complete!"));
    console.log();
    console.log(`  ${chalk.cyan("cd")} ${projectName}`);
    console.log(
      `  ${chalk.cyan(
        packageManager === "npm" ? "npm run dev" : `${packageManager} dev`
      )}`
    );
    console.log();
  });
