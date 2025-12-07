import { Command } from "commander";
import { executeCommand, writeToFile } from "./utils";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

const inquirer = jest.requireMock("inquirer");

// Mock chalk for testing
jest.mock("chalk", () => ({
  green: jest.fn((msg) => msg),
  blue: jest.fn((msg) => msg),
  red: jest.fn((msg) => msg),
  yellow: jest.fn((msg) => msg),
}));

// Mock inquirer for testing user prompts
jest.mock("inquirer", () => ({
  prompt: jest.fn(() => Promise.resolve({})),
}));

// Mock spinner to avoid ESM issues with ora
jest.mock("./utils/spinner", () => ({
  createSpinner: jest.fn(() => ({
    start: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    text: jest.fn(),
  })),
}));

// Mock child_process.spawn for executeCommand
jest.mock("child_process", () => ({
  spawn: jest.fn((command, args, options) => {
    const eventHandlers: Record<string, Function> = {};
    return {
      on: (event: string, handler: Function) => {
        eventHandlers[event] = handler;
        if (event === "close") {
          // Simulate successful command execution asynchronously
          setTimeout(() => handler(0), 10);
        }
      },
    };
  }),
}));

// Mock fs for writeToFile
jest.mock("fs", () => ({
  writeFile: jest.fn((filePath, content, callback) => {
    if (filePath.includes("error")) {
      callback(new Error("Mock write error"));
    } else {
      callback(null);
    }
  }),
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => JSON.stringify({ scripts: {} })),
}));

describe("CLI Commands", () => {
  let program: Command;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Re-import the index.ts to get a fresh program instance with commands
    // Re-import the index.ts to get a fresh program instance with commands
    jest.isolateModules(() => {
      const indexModule = require("./index");
      program = indexModule.program;
      program.exitOverride();
      console.log(
        "Registered commands:",
        program.commands.map((c: any) => c.name())
      );
    });

    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (spawn as unknown as jest.Mock).mockClear();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("should display help when no arguments are provided", () => {
    const outputHelpSpy = jest
      .spyOn(program, "outputHelp")
      .mockImplementation(() => {});
    program.parse([]);
    expect(outputHelpSpy).toHaveBeenCalled();
    outputHelpSpy.mockRestore();
  });

  describe("init command", () => {
    it("should initialize a Nuxt.js project successfully", async () => {
      const projectName = "test-nuxt-project";
      (inquirer.prompt as any).mockResolvedValueOnce({}); // No prompts for init command yet

      await program.parseAsync(["init", projectName], { from: "user" });

      expect(logSpy).toHaveBeenCalledWith(
        `Initializing new Nuxt.js project: ${projectName}...`
      );
      expect(spawn).toHaveBeenCalledWith(
        "npx",
        ["nuxi", "init", projectName, "--packageManager", "npm", "--gitInit"],
        expect.anything()
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Nuxt.js project '${projectName}' created successfully!`
      );
    });

    it("should handle errors during Nuxt.js project initialization", async () => {
      const projectName = "error-nuxt-project";
      // Mock spawn to fail
      (spawn as unknown as jest.Mock).mockImplementationOnce(() => ({
        on: (event: string, handler: Function) => {
          if (event === "close") {
            setTimeout(() => handler(1), 10); // Exit code 1
          }
        },
      }));

      await program.parseAsync(["init", projectName], { from: "user" });

      expect(logSpy).toHaveBeenCalledWith(
        `Initializing new Nuxt.js project: ${projectName}...`
      );
      expect(spawn).toHaveBeenCalledWith(
        "npx",
        ["nuxi", "init", projectName, "--packageManager", "npm", "--gitInit"],
        expect.anything()
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create Nuxt.js project")
      );
    });
  });

  describe("hasura command", () => {
    it("should set up Hasura with default values", async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({
        hasuraEndpoint: "http://localhost:8080/v1/graphql",
        hasuraAdminSecret: "",
      });

      await program.parseAsync(["hasura"], { from: "user" });

      expect(logSpy).toHaveBeenCalledWith("Setting up GraphQL with Hasura...");
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith("Hasura configuration:");
      expect(logSpy).toHaveBeenCalledWith(
        "Endpoint: http://localhost:8080/v1/graphql"
      );
      expect(logSpy).toHaveBeenCalledWith("Admin Secret: None");
    });
  });

  describe("codegen command", () => {
    it("should set up GraphQL Codegen successfully", async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({
        schemaPath: "./schema.graphql",
        outputDir: "./types/graphql",
      });

      await program.parseAsync(["codegen"], { from: "user" });

      expect(logSpy).toHaveBeenCalledWith("Setting up GraphQL Codegen...");
      expect(inquirer.prompt).toHaveBeenCalled();

      // Check first spawn call (install dependencies)
      expect(spawn).toHaveBeenCalledWith(
        "pnpm",
        expect.arrayContaining([
          "add",
          "-D",
          "@graphql-codegen/cli",
          "@graphql-codegen/typescript",
          "@graphql-codegen/typescript-operations",
          "@graphql-codegen/typescript-vue-apollo",
        ]),
        expect.anything()
      );

      expect(logSpy).toHaveBeenCalledWith(
        "GraphQL Codegen dependencies installed."
      );
      expect(logSpy).toHaveBeenCalledWith(
        "Initializing GraphQL Codegen configuration..."
      );
      expect(writeToFile).toHaveBeenCalledWith(
        path.join(process.cwd(), "codegen.ts"),
        expect.stringContaining('schema: "./schema.graphql"')
      );
      expect(logSpy).toHaveBeenCalledWith(
        "GraphQL Codegen configuration created in codegen.ts."
      );

      // Check second spawn call (run codegen)
      expect(spawn).toHaveBeenCalledWith(
        "pnpm",
        ["graphql-codegen"],
        expect.anything()
      );

      expect(logSpy).toHaveBeenCalledWith(
        "GraphQL types generated successfully!"
      );
    });

    it("should handle errors during codegen setup", async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({
        schemaPath: "./schema.graphql",
        outputDir: "./types/graphql",
      });

      // Mock spawn to fail
      (spawn as unknown as jest.Mock).mockImplementationOnce(() => ({
        on: (event: string, handler: Function) => {
          if (event === "close") {
            setTimeout(() => handler(1), 10);
          }
        },
      }));

      await program.parseAsync(["codegen"], { from: "user" });

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to set up GraphQL Codegen")
      );
    });
  });

  describe("get-schema command", () => {
    it("should fetch GraphQL schema successfully", async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({
        schemaEndpoint: "http://localhost:8080/v1/graphql",
        outputPath: "./schema.graphql",
      });

      await program.parseAsync(["get-schema"], { from: "user" });

      expect(logSpy).toHaveBeenCalledWith("Fetching GraphQL schema...");
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalledWith(
        "pnpm",
        expect.arrayContaining(["add", "-D", "get-graphql-schema"]),
        expect.anything()
      );
      expect(logSpy).toHaveBeenCalledWith(
        "get-graphql-schema installed, scripts added."
      );
    });

    it("should handle errors during schema fetching", async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({
        schemaEndpoint: "http://localhost:8080/v1/graphql",
        outputPath: "./schema.graphql",
      });

      (spawn as unknown as jest.Mock).mockImplementationOnce(() => ({
        on: (event: string, handler: Function) => {
          if (event === "close") {
            setTimeout(() => handler(1), 10);
          }
        },
      }));

      await program.parseAsync(["node", "index.ts", "get-schema"]);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to fetch GraphQL schema")
      );
    });
  });

  describe("graphql-client command", () => {
    it("should install Apollo client successfully", async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({
        client: "Apollo",
      });

      await program.parseAsync(["graphql-client"], { from: "user" });

      expect(logSpy).toHaveBeenCalledWith("Setting up GraphQL client...");
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalledWith(
        "pnpm",
        ["add", "@nuxtjs/apollo"],
        expect.anything()
      );
      expect(logSpy).toHaveBeenCalledWith("Nuxt Apollo installed.");
      expect(logSpy).toHaveBeenCalledWith(
        'Please remember to add "@nuxtjs/apollo" to your nuxt.config.ts modules.'
      );
      expect(logSpy).toHaveBeenCalledWith(
        "Apollo GraphQL client set up successfully!"
      );
    });

    it("should install Urql client successfully", async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({
        client: "Urql",
      });

      await program.parseAsync(["graphql-client"], { from: "user" });

      expect(logSpy).toHaveBeenCalledWith("Setting up GraphQL client...");
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalledWith(
        "pnpm",
        ["add", "@urql/vue", "graphql"],
        expect.anything()
      );
      expect(logSpy).toHaveBeenCalledWith("Nuxt Urql installed.");
      expect(logSpy).toHaveBeenCalledWith(
        "Please remember to configure Urql in your Nuxt.js project."
      );
      expect(logSpy).toHaveBeenCalledWith(
        "Urql GraphQL client set up successfully!"
      );
    });

    it("should handle errors during client installation", async () => {
      (inquirer.prompt as any).mockResolvedValueOnce({
        client: "Apollo",
      });

      (spawn as unknown as jest.Mock).mockImplementationOnce(() => ({
        on: (event: string, handler: Function) => {
          if (event === "close") {
            setTimeout(() => handler(1), 10);
          }
        },
      }));

      await program.parseAsync(["node", "index.ts", "graphql-client"]);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to set up GraphQL client")
      );
    });
  });

  describe("config command", () => {
    it("should save configuration successfully", async () => {
      const config = {
        defaultHasuraEndpoint: "http://localhost:8080/v1/graphql",
        defaultSchemaPath: "./schema.graphql",
        defaultCodegenOutputDir: "./types/graphql",
      };
      (inquirer.prompt as any).mockResolvedValueOnce(config);

      await program.parseAsync(["config"], { from: "user" });

      expect(logSpy).toHaveBeenCalledWith("Configuring CLI defaults...");
      expect(inquirer.prompt).toHaveBeenCalled();
      expect(writeToFile).toHaveBeenCalledWith(
        ".create-nuxt-hasura-cli.json",
        JSON.stringify(config, null, 2)
      );
      expect(logSpy).toHaveBeenCalledWith(
        "Configuration saved to .create-nuxt-hasura-cli.json"
      );
    });

    it("should handle errors during configuration saving", async () => {
      const config = {
        defaultHasuraEndpoint: "http://localhost:8080/v1/graphql",
        defaultSchemaPath: "./schema.graphql",
        defaultCodegenOutputDir: "./types/graphql",
      };
      (inquirer.prompt as any).mockResolvedValueOnce(config);
      (writeToFile as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to write config")
      );

      await program.parseAsync(["node", "index.ts", "config"]);

      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to save configuration: Failed to write config"
      );
    });
  });
});
