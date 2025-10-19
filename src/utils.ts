import { exec } from 'child_process';
import * as fs from 'fs';

export function executeCommand(command: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

export function writeToFile(filePath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, (err: NodeJS.ErrnoException | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}