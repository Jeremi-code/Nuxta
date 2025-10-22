import ora from "ora";
import chalk from "chalk";

export const createSpinner = (text: string) => {
  const spinner = ora(text).start();

  return {
    succeed: (message: string) => spinner.succeed(chalk.green(message)),
    fail: (message: string) => spinner.fail(chalk.red(message)),
    info: (message: string) => spinner.info(chalk.blue(message)),
    warn: (message: string) => spinner.warn(chalk.yellow(message)),
    text: (message: string) => (spinner.text = message),
  };
};