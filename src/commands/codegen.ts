import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { executeCommand, writeToFile } from "../utils";
import { createSpinner } from "../utils/spinner";

export const codegenCommand = new Command()
  .name("codegen")
  .description("Integrate GraphQL Codegen into the Nuxt.js project.")
  .action(async () => {
    const spinner = createSpinner("Setting up GraphQL Codegen...");
    try {
      // ensureProjectInitialized();
      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "schemaPath",
          message:
            "Enter the path to your GraphQL schema file (e.g., ./schema.graphql):",
          default: "./schema.graphql",
        },
        {
          type: "input",
          name: "outputDir",
          message:
            "Enter the output directory for generated types (e.g., ./types/graphql):",
          default: "./types/graphql",
        },
      ]);

      const { schemaPath, outputDir } = answers;

      spinner.text(chalk.blue("Installing GraphQL Codegen dependencies..."));
      await executeCommand(
        "pnpm add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-vue-apollo"
      );
      spinner.text(chalk.blue("GraphQL Codegen dependencies installed."));

      spinner.text(chalk.blue("Initializing GraphQL Codegen configuration..."));
      const codegenConfig = `
        module.exports = {
          overwrite: true,
          schema: "${schemaPath}",
          documents: "graphql/**/*.graphql",
          generates: {
            "${outputDir}/": {
              preset: "client",
              plugins: [],
              presetConfig: {
                gqlTagName: "gql",
                }
                }
                }
                };
                `;
      await writeToFile(`${process.cwd()}/codegen.ts`, codegenConfig);
      spinner.text(
        chalk.blue("GraphQL Codegen configuration created in codegen.ts.")
      );

      spinner.text(chalk.blue("Generating GraphQL types..."));
      await executeCommand("pnpm graphql-codegen");
      spinner.succeed(chalk.green("GraphQL types generated successfully!"));
    } catch (error) {
      spinner.fail(
        chalk.red(
          `Failed to set up GraphQL Codegen: ${(error as Error).message}`
        )
      );
    }
  });