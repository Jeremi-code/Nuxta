import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import {
  executeCommand,
  writeToFile,
  getAddCommand,
  detectPackageManager,
  getPackageExecutor,
} from "../utils";
import { PackageManager } from "../types";
import { createSpinner } from "../utils/spinner";

export async function setupCodegen(
  packageManager?: PackageManager
): Promise<void> {
  try {
    const pm = packageManager || detectPackageManager();

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
    const addCmd = getAddCommand(pm, true);

    const spinner = createSpinner("Installing GraphQL Codegen dependencies...");
    await executeCommand(
      `${addCmd} @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-vue-apollo`,
      { stdio: "pipe" }
    );
    spinner.succeed("GraphQL Codegen dependencies installed.");

    const configSpinner = createSpinner(
      "Initializing GraphQL Codegen configuration..."
    );
    const codegenConfig = `
import { type CodegenConfig } from "@graphql-codegen/cli";
import { type TypeScriptPluginConfig } from "@graphql-codegen/typescript";
import { getNullableType } from "graphql";
const config: CodegenConfig = {
  overwrite: true,
  schema: "./gqlGen/schema.gql",
  documents: ["graphql/**/*.{graphql,gql}"],
  generates: {
    "./gqlGen/types.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {} satisfies TypeScriptPluginConfig,
    },
  },
};
export default config;
`;
    await writeToFile(`${process.cwd()}/codegen.ts`, codegenConfig);
    configSpinner.succeed("GraphQL Codegen configuration created.");

    const executor = getPackageExecutor(pm);
    const genSpinner = createSpinner("Generating GraphQL types...");
    await executeCommand(`${executor} graphql-codegen`, { stdio: "pipe" });
    genSpinner.succeed("GraphQL types generated successfully!");
  } catch (error) {
    const errorSpinner = createSpinner("");
    errorSpinner.fail(
      `Failed to set up GraphQL Codegen: ${(error as Error).message}`
    );
    throw error;
  }
}

export const codegenCommand = new Command()
  .name("codegen")
  .description("Integrate GraphQL Codegen into the Nuxt.js project.")
  .action(() => setupCodegen());
