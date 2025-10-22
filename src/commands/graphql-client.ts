import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { executeCommand } from "../utils";
import { createSpinner } from "../utils/spinner";

export const graphqlClientCommand = new Command()
  .name("graphql-client")
  .description("Integrate Nuxt Apollo or Urql into the Nuxt.js project.")
  .action(async () => {
    const spinner = createSpinner("Setting up GraphQL client...");
    try {
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "client",
          message: "Which GraphQL client do you want to use?",
          choices: ["Apollo", "Urql"],
        },
      ]);

      const { client } = answers;

      if (client === "Apollo") {
        spinner.text(chalk.blue("Installing Nuxt Apollo dependencies..."));
        await executeCommand("pnpm add @nuxtjs/apollo");
        spinner.succeed(chalk.green("Nuxt Apollo installed."));
        console.log(
          chalk.yellow(
            'Please remember to add "@nuxtjs/apollo" to your nuxt.config.ts modules.'
          )
        );
      } else if (client === "Urql") {
        spinner.text(chalk.blue("Installing Nuxt Urql dependencies..."));
        await executeCommand("pnpm add @urql/vue graphql");
        spinner.succeed(chalk.green("Nuxt Urql installed."));
        console.log(
          chalk.yellow(
            "Please remember to configure Urql in your Nuxt.js project."
          )
        );
      }
      spinner.succeed(
        chalk.green(`${client} GraphQL client set up successfully!`)
      );
    } catch (error) {
      spinner.fail(
        chalk.red(
          `Failed to set up GraphQL client: ${(error as Error).message}`
        )
      );
    }
  });