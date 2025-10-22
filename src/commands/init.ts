import { Command } from "commander";
import chalk from "chalk";
import { executeCommand } from "../utils";
import { createSpinner } from "../utils/spinner";

export const initCommand = new Command()
  .name("init")
  .description(
    "Initialize a new Nuxt.js project with Hasura and GraphQL setup."
  )
  .argument("<project-name>", "Name of the Nuxt.js project")
  .action(async (projectName: string) => {
    const spinner = createSpinner(
      `Initializing new Nuxt.js project: ${projectName}...`
    );
    try {
      await executeCommand(`npx nuxi init ${projectName}`);
      spinner.succeed(
        chalk.green(`Nuxt.js project '${projectName}' created successfully!`)
      );
    } catch (error) {
      spinner.fail(
        chalk.red(
          `Failed to create Nuxt.js project: ${(error as Error).message}`
        )
      );
    }
  });