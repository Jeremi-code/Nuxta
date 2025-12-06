import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { ensureProjectInitialized } from "../utils";
import { createSpinner } from "../utils/spinner";

export async function setupHasura(skipProjectCheck = false): Promise<void> {
  const spinner = createSpinner("Setting up GraphQL with Hasura...");
  try {
    if (!skipProjectCheck) {
      ensureProjectInitialized();
    }
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "hasuraEndpoint",
        message: "Enter your Hasura GraphQL endpoint:",
        default: "http://localhost:8080/v1/graphql",
      },
      {
        type: "input",
        name: "hasuraAdminSecret",
        message:
          "Enter your Hasura admin secret (leave blank if not applicable):",
      },
    ]);

    spinner.succeed(chalk.green("GraphQL with Hasura setup initiated."));
    console.log(chalk.blue("Hasura configuration:"));
    console.log(`Endpoint: ${answers.hasuraEndpoint}`);
    console.log(
      `Admin Secret: ${answers.hasuraAdminSecret ? "******" : "None"}`
    );
  } catch (error) {
    spinner.fail(
      chalk.red(
        `Failed to set up GraphQL with Hasura: ${(error as Error).message}`
      )
    );
    throw error;
  }
}

export const hasuraCommand = new Command()
  .name("hasura")
  .description("Set up GraphQL with Hasura in the Nuxt.js project.")
  .action(() => setupHasura());
