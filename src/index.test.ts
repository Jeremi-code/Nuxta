import { Command } from 'commander';
import { executeCommand, writeToFile } from './utils';
import * as fs from 'fs';
import * as path from 'path';

// Mock chalk for testing
jest.mock('chalk', () => ({
  green: jest.fn((msg) => msg),
  blue: jest.fn((msg) => msg),
  red: jest.fn((msg) => msg),
  yellow: jest.fn((msg) => msg),
}));

// Mock inquirer for testing user prompts
jest.mock('inquirer', () => ({
  prompt: jest.fn(() => Promise.resolve({})),
}));

// Mock child_process.exec for executeCommand
jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => {
    if (command.includes('error')) {
      callback(new Error('Mock error'), '', 'Mock stderr');
    } else {
      callback(null, 'Mock stdout', '');
    }
  }),
}));

// Mock fs for writeToFile
jest.mock('fs', () => ({
  writeFile: jest.fn((filePath, content, callback) => {
    if (filePath.includes('error')) {
      callback(new Error('Mock write error'));
    } else {
      callback(null);
    }
  }),
}));

describe('CLI Commands', () => {
  let program: Command;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program
      .name('create-nuxt-hasura-cli')
      .description('CLI to create Nuxt.js projects with Hasura, GraphQL Codegen, and Apollo/Urql setup.')
      .version('1.0.0');

    // Re-import the index.ts to get a fresh program instance with commands
    jest.isolateModules(() => {
      require('./index');
    });

    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should display help when no arguments are provided', () => {
    const outputHelpSpy = jest.spyOn(program, 'outputHelp').mockImplementation(() => {});
    program.parse([]);
    expect(outputHelpSpy).toHaveBeenCalled();
    outputHelpSpy.mockRestore();
  });

  describe('init command', () => {
    it('should initialize a Nuxt.js project successfully', async () => {
      const projectName = 'test-nuxt-project';
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({}); // No prompts for init command yet

      await program.parseAsync(['node', 'index.ts', 'init', projectName]);

      expect(logSpy).toHaveBeenCalledWith(`Initializing new Nuxt.js project: ${projectName}...`);
      expect(executeCommand).toHaveBeenCalledWith(`npx nuxi init ${projectName}`);
      expect(logSpy).toHaveBeenCalledWith(`Nuxt.js project '${projectName}' created successfully!`);
    });

    it('should handle errors during Nuxt.js project initialization', async () => {
      const projectName = 'error-nuxt-project';
      (executeCommand as jest.Mock).mockRejectedValueOnce(new Error('Failed to init Nuxt'));

      await program.parseAsync(['node', 'index.ts', 'init', projectName]);

      expect(logSpy).toHaveBeenCalledWith(`Initializing new Nuxt.js project: ${projectName}...`);
      expect(executeCommand).toHaveBeenCalledWith(`npx nuxi init ${projectName}`);
      expect(errorSpy).toHaveBeenCalledWith(`Failed to create Nuxt.js project: Failed to init Nuxt`);
    });
  });

  describe('hasura command', () => {
    it('should set up Hasura with default values', async () => {
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({
        hasuraEndpoint: 'http://localhost:8080/v1/graphql',
        hasuraAdminSecret: '',
      });

      await program.parseAsync(['node', 'index.ts', 'hasura']);

      expect(logSpy).toHaveBeenCalledWith('Setting up GraphQL with Hasura...');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Hasura configuration:');
      expect(logSpy).toHaveBeenCalledWith('Endpoint: http://localhost:8080/v1/graphql');
      expect(logSpy).toHaveBeenCalledWith('Admin Secret: None');
    });
  });

  describe('codegen command', () => {
    it('should set up GraphQL Codegen successfully', async () => {
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({
        schemaPath: './schema.graphql',
        outputDir: './types/graphql',
      });

      await program.parseAsync(['node', 'index.ts', 'codegen']);

      expect(logSpy).toHaveBeenCalledWith('Setting up GraphQL Codegen...');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(executeCommand).toHaveBeenCalledWith('pnpm add -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-vue-apollo');
      expect(logSpy).toHaveBeenCalledWith('GraphQL Codegen dependencies installed.');
      expect(logSpy).toHaveBeenCalledWith('Initializing GraphQL Codegen configuration...');
      expect(writeToFile).toHaveBeenCalledWith(
        path.join(process.cwd(), 'codegen.ts'),
        expect.stringContaining('schema: "./schema.graphql"')
      );
      expect(logSpy).toHaveBeenCalledWith('GraphQL Codegen configuration created in codegen.ts.');
      expect(executeCommand).toHaveBeenCalledWith('pnpm graphql-codegen');
      expect(logSpy).toHaveBeenCalledWith('GraphQL types generated successfully!');
    });

    it('should handle errors during codegen setup', async () => {
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({
        schemaPath: './schema.graphql',
        outputDir: './types/graphql',
      });
      (executeCommand as jest.Mock).mockRejectedValueOnce(new Error('Failed to install codegen'));

      await program.parseAsync(['node', 'index.ts', 'codegen']);

      expect(errorSpy).toHaveBeenCalledWith('Failed to set up GraphQL Codegen: Failed to install codegen');
    });
  });

  describe('get-schema command', () => {
    it('should fetch GraphQL schema successfully', async () => {
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({
        schemaEndpoint: 'http://localhost:8080/v1/graphql',
        outputPath: './schema.graphql',
      });

      await program.parseAsync(['node', 'index.ts', 'get-schema']);

      expect(logSpy).toHaveBeenCalledWith('Fetching GraphQL schema...');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(executeCommand).toHaveBeenCalledWith('pnpm add -D get-graphql-schema');
      expect(logSpy).toHaveBeenCalledWith('get-graphql-schema installed.');
      expect(executeCommand).toHaveBeenCalledWith('get-graphql-schema http://localhost:8080/v1/graphql > ./schema.graphql');
      expect(logSpy).toHaveBeenCalledWith('GraphQL schema fetched successfully!');
    });

    it('should handle errors during schema fetching', async () => {
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({
        schemaEndpoint: 'http://localhost:8080/v1/graphql',
        outputPath: './schema.graphql',
      });
      (executeCommand as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch schema'));

      await program.parseAsync(['node', 'index.ts', 'get-schema']);

      expect(errorSpy).toHaveBeenCalledWith('Failed to fetch GraphQL schema: Failed to fetch schema');
    });
  });

  describe('graphql-client command', () => {
    it('should install Apollo client successfully', async () => {
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({
        client: 'Apollo',
      });

      await program.parseAsync(['node', 'index.ts', 'graphql-client']);

      expect(logSpy).toHaveBeenCalledWith('Setting up GraphQL client...');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(executeCommand).toHaveBeenCalledWith('pnpm add @nuxtjs/apollo');
      expect(logSpy).toHaveBeenCalledWith('Nuxt Apollo installed.');
      expect(logSpy).toHaveBeenCalledWith('Please remember to add "@nuxtjs/apollo" to your nuxt.config.ts modules.');
      expect(logSpy).toHaveBeenCalledWith('Apollo GraphQL client set up successfully!');
    });

    it('should install Urql client successfully', async () => {
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({
        client: 'Urql',
      });

      await program.parseAsync(['node', 'index.ts', 'graphql-client']);

      expect(logSpy).toHaveBeenCalledWith('Setting up GraphQL client...');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(executeCommand).toHaveBeenCalledWith('pnpm add @urql/vue graphql');
      expect(logSpy).toHaveBeenCalledWith('Nuxt Urql installed.');
      expect(logSpy).toHaveBeenCalledWith('Please remember to configure Urql in your Nuxt.js project.');
      expect(logSpy).toHaveBeenCalledWith('Urql GraphQL client set up successfully!');
    });

    it('should handle errors during client installation', async () => {
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce({
        client: 'Apollo',
      });
      (executeCommand as jest.Mock).mockRejectedValueOnce(new Error('Failed to install client'));

      await program.parseAsync(['node', 'index.ts', 'graphql-client']);

      expect(errorSpy).toHaveBeenCalledWith('Failed to set up GraphQL client: Failed to install client');
    });
  });

  describe('config command', () => {
    it('should save configuration successfully', async () => {
      const config = {
        defaultHasuraEndpoint: 'http://localhost:8080/v1/graphql',
        defaultSchemaPath: './schema.graphql',
        defaultCodegenOutputDir: './types/graphql',
      };
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce(config);

      await program.parseAsync(['node', 'index.ts', 'config']);

      expect(logSpy).toHaveBeenCalledWith('Configuring CLI defaults...');
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(writeToFile).toHaveBeenCalledWith(
        '.create-nuxt-hasura-cli.json',
        JSON.stringify(config, null, 2)
      );
      expect(logSpy).toHaveBeenCalledWith('Configuration saved to .create-nuxt-hasura-cli.json');
    });

    it('should handle errors during configuration saving', async () => {
      const config = {
        defaultHasuraEndpoint: 'http://localhost:8080/v1/graphql',
        defaultSchemaPath: './schema.graphql',
        defaultCodegenOutputDir: './types/graphql',
      };
      (inquirer.prompt as jest.Mock).mockResolvedValueOnce(config);
      (writeToFile as jest.Mock).mockRejectedValueOnce(new Error('Failed to write config'));

      await program.parseAsync(['node', 'index.ts', 'config']);

      expect(errorSpy).toHaveBeenCalledWith('Failed to save configuration: Failed to write config');
    });
  });
});