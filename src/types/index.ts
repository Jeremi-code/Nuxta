export interface ExecuteCommandOptions {
  cwd?: string;
  stdio?: "inherit" | "ignore" | "pipe" | any[];
}

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export interface EnvVariable {
  key: string;
  value: string;
  comment?: string;
}

export interface CreateEnvOptions {
  filename?: string;
  header?: string;
  overwrite?: boolean;
}

export interface InitOptions {
  git: boolean;
  hasura: boolean;
  codegen: boolean;
  getSchema: boolean;
  graphqlClient?: GraphqlClient;
}

export type GraphqlClient = "apollo" | "urql";
