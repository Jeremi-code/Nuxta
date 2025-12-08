import * as cliProgress from "cli-progress";
import chalk from "chalk";

export interface ProgressBarOptions {
  message: string;
  total?: number;
}

export function createProgressBar(options: ProgressBarOptions) {
  const bar = new cliProgress.SingleBar(
    {
      format: `${chalk.cyan("{message}")} ${chalk.green(
        "{bar}"
      )} ${chalk.yellow("{percentage}%")}`,
      barCompleteChar: "█",
      barIncompleteChar: "░",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  let interval: NodeJS.Timeout | null = null;
  let currentValue = 0;
  const total = options.total || 100;

  return {
    start: () => {
      bar.start(total, 0, { message: options.message });
      currentValue = 0;

      interval = setInterval(() => {
        if (currentValue < 90) {
          const increment = currentValue < 50 ? 5 : currentValue < 80 ? 2 : 1;
          currentValue = Math.min(currentValue + increment, 90);
          bar.update(currentValue, { message: options.message });
        }
      }, 200);
    },

    update: (value: number, message?: string) => {
      currentValue = value;
      bar.update(value, { message: message || options.message });
    },

    stop: (success: boolean = true) => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      bar.update(100, { message: options.message });
      bar.stop();

      if (success) {
        console.log(chalk.green(`✔ ${options.message} - Complete!`));
      } else {
        console.log(chalk.red(`✖ ${options.message} - Failed!`));
      }
    },
  };
}
