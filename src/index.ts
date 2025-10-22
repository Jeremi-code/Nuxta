import { Command } from "commander";
import { initCommand } from "./commands/init";
import { hasuraCommand } from "./commands/hasura";
import { codegenCommand } from "./commands/codegen";
import { getSchemaCommand } from "./commands/get-schema";
import { graphqlClientCommand } from "./commands/graphql-client";
import { configCommand } from "./commands/config";

const program = new Command();

program
  .name("nuxta")
  .description(
    "CLI to create Nuxt.js projects with Hasura, GraphQL Codegen, and Apollo/Urql setup."
  )
  .version("1.0.0");

program.addCommand(initCommand);
program.addCommand(hasuraCommand);
program.addCommand(codegenCommand);
program.addCommand(getSchemaCommand);
program.addCommand(graphqlClientCommand);
program.addCommand(configCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
