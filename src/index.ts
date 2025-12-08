import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init";
import { codegenCommand } from "./commands/codegen";
import { getSchemaCommand } from "./commands/get-schema";
import { graphqlClientCommand } from "./commands/graphql-client";

const logo = `
${chalk.hex("#00DC82")("        .d$b.")}
${chalk.hex("#00DC82")("       i$$A$$L  .d$b         d$Pd$b")}
${chalk.hex("#00DC82")("     .$$F` `$$L.$$A$$.           $$")}
${chalk.hex("#00DC82")("    j$$'    `4$$:` `$$.      d$$$$$")}
${chalk.hex("#00DC82")("   j$$'     .4$:    `$$.     $P   $")}
${chalk.hex("#00DC82")("  j$$`     .$$:      `4$L    $P   $")}
${chalk.hex("#00DC82")(" :$$:____.d$$:  _____.:$$:   d$$$$$")}
${chalk.hex("#00DC82")(" `4$$$$$$$$P` .i$$$$$$$$P`")}
`;

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

// Show logo when running without arguments
if (!process.argv.slice(2).length) {
  console.log(logo);
  program.outputHelp();
  process.exit(0);
}

program.parse(process.argv);
