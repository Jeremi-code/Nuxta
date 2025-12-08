import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { createSpinner } from "../utils/spinner";
import { createProgressBar } from "../utils/progress";
import { executeCommand, getPackageExecutor } from "../utils";
import { PackageManager } from "../types";
import { setupCodegen } from "./codegen";
import { setupGetSchema } from "./get-schema";
import { setupGraphqlClient, GraphqlClient } from "./graphql-client";

interface InitOptions {
  git: boolean;
  hasura: boolean;
  codegen: boolean;
  getSchema: boolean;
  graphqlClient?: GraphqlClient;
}

export const initCommand = new Command()
  .name("init")
  .description("Initialize a new Nuxt.js project.")
  .argument("<project-name>", "Name of the Nuxt.js project")
  .option("--no-git", "Skip git initialization")
  .option("--hasura", "Set up Hasura GraphQL")
  .option("--codegen", "Set up GraphQL Codegen")
  .option("--get-schema", "Set up get-graphql-schema")
  .option("--graphql-client <type>", "Set up GraphQL client (apollo or urql)")
  .action(async (projectName: string, options: InitOptions) => {
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

    const executor = getPackageExecutor(packageManager);

    const spinner = createSpinner(`Creating Nuxt project: ${projectName}...`);
    try {
      await executeCommand(
        `${executor} giget@latest gh:nuxt/starter#v3 ${projectName}`,
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

    const progressBar = createProgressBar({
      message: "Installing dependencies",
    });

    progressBar.start();
    try {
      await executeCommand(`${packageManager} install`, {
        cwd: projectName,
        stdio: "pipe",
      });
      progressBar.stop(true);
    } catch (error) {
      progressBar.stop(false);
      console.log(
        chalk.red(`Failed to install dependencies: ${(error as Error).message}`)
      );
      process.exit(1);
    }

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

    const originalCwd = process.cwd();
    process.chdir(projectName);

    try {
      if (options.codegen) {
        console.log();
        await setupCodegen(packageManager);
      }

      if (options.getSchema) {
        console.log();
        await setupGetSchema(packageManager);
      }

      if (options.graphqlClient) {
        console.log();
        await setupGraphqlClient(
          options.graphqlClient as GraphqlClient,
          packageManager
        );
      }
    } finally {
      process.chdir(originalCwd);
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
