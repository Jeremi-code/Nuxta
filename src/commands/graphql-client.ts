import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { executeCommand } from "../utils";
import { PackageManager } from "../types";
import { createSpinner } from "../utils/spinner";

export type GraphqlClient = "apollo" | "urql";

function getAddCommand(pm: PackageManager): string {
  const commands: Record<PackageManager, string> = {
    npm: "npm install",
    yarn: "yarn add",
    pnpm: "pnpm add",
    bun: "bun add",
  };
  return commands[pm];
}

export async function setupGraphqlClient(
  client?: GraphqlClient,
  packageManager: PackageManager = "pnpm"
): Promise<void> {
  try {
    let selectedClient = client;

    if (!selectedClient) {
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "client",
          message: "Which GraphQL client do you want to use?",
          choices: [
            { name: "Apollo", value: "apollo" },
            { name: "Urql", value: "urql" },
          ],
        },
      ]);
      selectedClient = answers.client;
    }

    const addCmd = getAddCommand(packageManager);

    if (selectedClient === "apollo") {
      const spinner = createSpinner("Installing Nuxt Apollo dependencies...");
      await executeCommand(`${addCmd} @nuxtjs/apollo`, { stdio: "pipe" });
      spinner.succeed("Nuxt Apollo installed.");
      console.log(
        chalk.yellow(
          'Please remember to add "@nuxtjs/apollo" to your nuxt.config.ts modules.'
        )
      );
    } else if (selectedClient === "urql") {
      const spinner = createSpinner("Installing Nuxt Urql dependencies...");
      await executeCommand(`${addCmd} @urql/vue graphql`, { stdio: "pipe" });
      spinner.succeed("Nuxt Urql installed.");
      console.log(
        chalk.yellow(
          "Please remember to configure Urql in your Nuxt.js project."
        )
      );
    }
  } catch (error) {
    const errorSpinner = createSpinner("");
    errorSpinner.fail(
      `Failed to set up GraphQL client: ${(error as Error).message}`
    );
    throw error;
  }
}

export const graphqlClientCommand = new Command()
  .name("graphql-client")
  .description("Integrate Nuxt Apollo or Urql into the Nuxt.js project.")
  .action(() => setupGraphqlClient());
