import { Command } from "commander";
import { initCommand } from "./commands/init";
import { codegenCommand } from "./commands/codegen";
import { getSchemaCommand } from "./commands/get-schema";
import { graphqlClientCommand } from "./commands/graphql-client";

export const program = new Command();

program
  .name("nuxta")
  .description(
    "CLI to create Nuxt.js projects with Hasura, GraphQL Codegen, and Apollo/Urql setup."
  )
  .version("1.0.0");

program.addCommand(initCommand);
program.addCommand(codegenCommand);
program.addCommand(getSchemaCommand);
program.addCommand(graphqlClientCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
