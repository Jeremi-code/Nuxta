import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import {
  executeCommand,
  addScriptToPackageJson,
  getAddCommand,
  detectPackageManager,
} from "../utils";
import { PackageManager } from "../types";
import { createSpinner } from "../utils/spinner";
import { createEnvFile } from "../utils";
import { createProgressBar } from "../utils/progress";

export async function setupGetSchema(
  packageManager?: PackageManager
): Promise<void> {
  try {
    const pm = packageManager || detectPackageManager();

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "schemaEndpoint",
        message: "Enter your GraphQL schema endpoint:",
        default: "http://localhost:8080/v1/graphql",
      },
      {
        type: "input",
        name: "outputPath",
        message:
          "Enter the output path for the schema file (e.g., ./schema.graphql):",
        default: "./schema.graphql",
      },
    ]);

    const { schemaEndpoint, outputPath } = answers;

    const scripts = {
      "fetch:schema": `dotenv -- sh -c \'get-graphql-schema -h "x-hasura-admin-secret=$NUXT_HASURA_GRAPHQL_ADMIN_SECRET" "$NUXT_HASURA_GRAPHQL_ENDPOINT_LOCAL" > ${outputPath}\'`,
    };

    const addCmd = getAddCommand(pm, true);
    const getGraphqlSchemaProgressBar = createProgressBar({
      message: "Installing get-graphql-schema",
    });

    getGraphqlSchemaProgressBar.start();
    try {
      await executeCommand(`${addCmd} get-graphql-schema`, { stdio: "pipe" });
      getGraphqlSchemaProgressBar.stop(true);
    } catch (error) {
      getGraphqlSchemaProgressBar.stop(false);
      console.log(
        chalk.red(
          `Failed to install get-graphql-schema: ${(error as Error).message}`
        )
      );
      process.exit(1);
    }
    const dotenvProgressBar = createProgressBar({
      message: "Installing dotenv-cli",
    });

    dotenvProgressBar.start();
    try {
      await executeCommand(`${addCmd} dotenv-cli`, { stdio: "pipe" });
      dotenvProgressBar.stop(true);
    } catch (error) {
      dotenvProgressBar.stop(true);
      console.log(
        chalk.red(`Failed to install dotenv-cli: ${(error as Error).message}`)
      );
      process.exit(1);
    }

    await addScriptToPackageJson(scripts);
    console.log(chalk.green("✔ Scripts added to package.json"));

    const result = createEnvFile(
      [
        {
          key: "NUXT_HASURA_GRAPHQL_ENDPOINT_LOCAL",
          value: schemaEndpoint,
        },
        {
          key: "NUXT_HASURA_GRAPHQL_ADMIN_SECRET",
          value: "your-admin-secret-here",
        },
      ],
      { header: "GraphQL Configuration" }
    );

    if (result.created) {
      console.log(chalk.green("✔ .env.example created"));
    } else {
      console.log(chalk.yellow("ℹ .env.example already exists, skipping"));
    }
  } catch (error) {
    const errorSpinner = createSpinner("");
    errorSpinner.fail(
      `Failed to set up get-schema: ${(error as Error).message}`
    );
    throw error;
  }
}

export const getSchemaCommand = new Command()
  .name("get-schema")
  .description("Fetch GraphQL schema from a specified endpoint.")
  .action(() => setupGetSchema());
