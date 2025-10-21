import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import {
  executeCommand,
  writeToFile,
  ensureProjectInitialized,
  addScriptToPackageJson,
} from "./utils";

const program = new Command();

program
  .name("create-nuxt-hasura-cli")
  .description(
    "CLI to create Nuxt.js projects with Hasura, GraphQL Codegen, and Apollo/Urql setup."
  )
  .version("1.0.0");

program
  .command("init")
  .description(
    "Initialize a new Nuxt.js project with Hasura and GraphQL setup."
  )
  .argument("<project-name>", "Name of the Nuxt.js project")
  .action(async (projectName: string) => {
    console.log(
      chalk.green(`Initializing new Nuxt.js project: ${projectName}...`)
    );
    try {
      await executeCommand(`npx nuxi init ${projectName}`);
      console.log(
        chalk.green(`Nuxt.js project '${projectName}' created successfully!`)
      );
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to create Nuxt.js project: ${(error as Error).message}`
        )
      );
    }
  });

program
  .command("hasura")
  .description("Set up GraphQL with Hasura in the Nuxt.js project.")
  .action(async () => {
    console.log(chalk.green("Setting up GraphQL with Hasura..."));
    ensureProjectInitialized();
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

    console.log(chalk.blue("Hasura configuration:"));
    console.log(`Endpoint: ${answers.hasuraEndpoint}`);
    console.log(
      `Admin Secret: ${answers.hasuraAdminSecret ? "******" : "None"}`
    );

    // Further logic for Hasura setup will go here, e.g., adding environment variables,
    // installing Hasura CLI, etc.
  });

program
  .command("codegen")
  .description("Integrate GraphQL Codegen into the Nuxt.js project.")
  .action(async () => {
    console.log(chalk.green("Setting up GraphQL Codegen..."));
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

    console.log(schemaPath);

    try {
      console.log(chalk.blue("Installing GraphQL Codegen dependencies..."));
      await executeCommand(
        "pnpm add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-vue-apollo"
      );
      console.log(chalk.green("GraphQL Codegen dependencies installed."));

      console.log(chalk.blue("Initializing GraphQL Codegen configuration..."));
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
      console.log(
        chalk.green("GraphQL Codegen configuration created in codegen.ts.")
      );

      console.log(chalk.blue("Generating GraphQL types..."));
      await executeCommand("pnpm graphql-codegen");
      console.log(chalk.green("GraphQL types generated successfully!"));
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to set up GraphQL Codegen: ${(error as Error).message}`
        )
      );
    }
  });

program
  .command("get-schema")
  .description("Fetch GraphQL schema from a specified endpoint.")
  .action(async () => {
    console.log(chalk.green("Fetching GraphQL schema..."));
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

    try {
      console.log(chalk.blue("Installing get-graphql-schema..."));
      await executeCommand("pnpm add -D get-graphql-schema");
      await executeCommand("pnpm add -D dotenv");
      await addScriptToPackageJson(scripts);
      console.log(chalk.green("get-graphql-schema installed, scripts added."));
    } catch (error) {
      console.error(
        chalk.red(`Failed to fetch GraphQL schema: ${(error as Error).message}`)
      );
    }
  });

program
  .command("graphql-client")
  .description("Integrate Nuxt Apollo or Urql into the Nuxt.js project.")
  .action(async () => {
    console.log(chalk.green("Setting up GraphQL client..."));
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "client",
        message: "Which GraphQL client do you want to use?",
        choices: ["Apollo", "Urql"],
      },
    ]);

    const { client } = answers;

    try {
      if (client === "Apollo") {
        console.log(chalk.blue("Installing Nuxt Apollo dependencies..."));
        await executeCommand("pnpm add @nuxtjs/apollo");
        console.log(chalk.green("Nuxt Apollo installed."));
        console.log(
          chalk.yellow(
            'Please remember to add "@nuxtjs/apollo" to your nuxt.config.ts modules.'
          )
        );
      } else if (client === "Urql") {
        console.log(chalk.blue("Installing Nuxt Urql dependencies..."));
        await executeCommand("pnpm add @urql/vue graphql");
        console.log(chalk.green("Nuxt Urql installed."));
        console.log(
          chalk.yellow(
            "Please remember to configure Urql in your Nuxt.js project."
          )
        );
      }
      console.log(chalk.green(`${client} GraphQL client set up successfully!`));
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to set up GraphQL client: ${(error as Error).message}`
        )
      );
    }
  });

program
  .command("config")
  .description("Configure default options for the CLI tool.")
  .action(async () => {
    console.log(chalk.green("Configuring CLI defaults..."));
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "defaultHasuraEndpoint",
        message: "Set default Hasura GraphQL endpoint:",
        default: "http://localhost:8080/v1/graphql",
      },
      {
        type: "input",
        name: "defaultSchemaPath",
        message: "Set default GraphQL schema path:",
        default: "./schema.graphql",
      },
      {
        type: "input",
        name: "defaultCodegenOutputDir",
        message: "Set default Codegen output directory:",
        default: "./types/graphql",
      },
    ]);

    const configContent = JSON.stringify(answers, null, 2);
    try {
      await writeToFile(".create-nuxt-hasura-cli.json", configContent);
      console.log(
        chalk.green("Configuration saved to .create-nuxt-hasura-cli.json")
      );
    } catch (error) {
      console.error(
        chalk.red(`Failed to save configuration: ${(error as Error).message}`)
      );
    }
  });
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
