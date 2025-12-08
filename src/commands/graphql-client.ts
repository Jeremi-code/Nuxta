import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import {
  executeCommand,
  writeToFile,
  detectNuxtVersion,
  ensureDirectoryExists,
  getAddCommand,
} from "../utils";
import { PackageManager, GraphqlClient } from "../types";
import { createSpinner } from "../utils/spinner";
import { createProgressBar } from "../utils/progress";

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
    const nuxtVersion = detectNuxtVersion();

    if (selectedClient === "apollo") {
      const { tokenName } = await inquirer.prompt([
        {
          type: "input",
          name: "tokenName",
          message:
            "Enter the token name for Apollo (e.g., apollo:myapp.token):",
          default: "apollo:app.token",
        },
      ]);

      const progressBar = createProgressBar({
        message: "Installing Nuxt Apollo dependencies",
      });
      progressBar.start();
      await executeCommand(`${addCmd} @nuxtjs/apollo`, { stdio: "pipe" });
      progressBar.stop(true);

      const configDir =
        nuxtVersion && nuxtVersion >= 4 ? "app/apollo" : "apollo";
      const configPath = `${process.cwd()}/${configDir}/apollo.ts`;

      ensureDirectoryExists(`${process.cwd()}/${configDir}`);

      const apolloConfig = `import { defineApolloClient } from "@nuxtjs/apollo/config";

export default defineApolloClient({
  httpEndpoint: process.env.NUXT_HASURA_GRAPHQL_ENDPOINT!,
  tokenName: "${tokenName}",
  httpLinkOptions: {
    credentials: "include",
  },
});
`;

      await writeToFile(configPath, apolloConfig);
      const configSpinner = createSpinner("");
      configSpinner.succeed(
        `Apollo configuration created at ${configDir}/apollo.ts`
      );

      console.log(
        chalk.yellow(
          '\nPlease remember to add "@nuxtjs/apollo" to your nuxt.config.ts modules.'
        )
      );
    } else if (selectedClient === "urql") {
      const { tokenName } = await inquirer.prompt([
        {
          type: "input",
          name: "tokenName",
          message:
            "Enter the cookie name for authentication (e.g., auth-token):",
          default: "auth-token",
        },
      ]);

      const progressBar = createProgressBar({
        message: "Installing Nuxt Urql dependencies",
      });
      progressBar.start();
      await executeCommand(`${addCmd} @urql/vue graphql`, { stdio: "pipe" });
      progressBar.stop(true);

      const pluginsDir =
        nuxtVersion && nuxtVersion >= 4 ? "app/plugins" : "plugins";
      const configPath = `${process.cwd()}/${pluginsDir}/urql.ts`;

      ensureDirectoryExists(`${process.cwd()}/${pluginsDir}`);

      const urqlConfig = `import { createClient, provideClient } from '@urql/vue';

export default defineNuxtPlugin((nuxtApp) => {
  const client = createClient({
    url: process.env.NUXT_HASURA_GRAPHQL_ENDPOINT!,
    fetchOptions: () => {
      const token = useCookie('${tokenName}');

      return {
        headers: {
          Authorization: token.value ? \`Bearer \${token.value}\` : '',
        },
      };
    },
  });

  provideClient(client);
});
`;

      await writeToFile(configPath, urqlConfig);
      const configSpinner = createSpinner("");
      configSpinner.succeed(
        `Urql configuration created at ${pluginsDir}/urql.ts`
      );

      console.log(
        chalk.green(
          "\nUrql has been configured with authentication support using useCookie."
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
