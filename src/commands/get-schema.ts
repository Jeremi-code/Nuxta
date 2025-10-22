import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { executeCommand, addScriptToPackageJson } from "../utils";
import { createSpinner } from "../utils/spinner";

export const getSchemaCommand = new Command()
  .name("get-schema")
  .description("Fetch GraphQL schema from a specified endpoint.")
  .action(async () => {
    const spinner = createSpinner("Fetching GraphQL schema...");
    try {
      // ensureProjectInitialized();
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
        "fetch:schema":
          'dotenv -- sh -c \'get-graphql-schema -h "x-hasura-admin-secret=$NUXT_HASURA_GRAPHQL_ADMIN_SECRET" "$NUXT_HASURA_GRAPHQL_ENDPOINT_LOCAL" > ./gqlGen/schema.gql\'',
        codegen:
          "pnpm fetch:schema && graphql-codegen --config codegen.ts --watch",
      };

      spinner.text(chalk.blue("Installing get-graphql-schema..."));
      await executeCommand("pnpm add -D get-graphql-schema");
      await executeCommand("pnpm add -D dotenv");
      await addScriptToPackageJson(scripts);
      spinner.succeed(
        chalk.green("get-graphql-schema installed, scripts added.")
      );
    } catch (error) {
      spinner.fail(
        chalk.red(`Failed to fetch GraphQL schema: ${(error as Error).message}`)
      );
    }
  });