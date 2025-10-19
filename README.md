# create-nuxt-hasura-cli

A CLI tool to streamline the creation of Nuxt.js projects with integrated Hasura, GraphQL Codegen, and your choice of Apollo or Urql GraphQL client.

## Installation

To use this CLI tool, you need to have Node.js and pnpm installed.

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/create-nuxt-hasura-cli.git
   cd create-nuxt-hasura-cli
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Link the CLI tool globally:
   ```bash
   pnpm link --global
   ```

## Usage

Once installed, you can use the `create-nuxt-hasura-cli` command (or `cnhc` if you set up an alias) to access the following commands:

### `cnhc init <project-name>`

Initializes a new Nuxt.js project with the specified name.

```bash
cnhc init my-nuxt-app
```

### `cnhc hasura`

Sets up GraphQL with Hasura in your Nuxt.js project. It will prompt you for your Hasura GraphQL endpoint and an optional admin secret.

```bash
cnhc hasura
```

### `cnhc codegen`

Integrates GraphQL Codegen into your Nuxt.js project. It will prompt for the path to your GraphQL schema file and the output directory for generated types.

```bash
cnhc codegen
```

### `cnhc get-schema`

Fetches the GraphQL schema from a specified endpoint and saves it to a file.

```bash
cnhc get-schema
```

### `cnhc graphql-client`

Integrates either Nuxt Apollo or Urql GraphQL client into your Nuxt.js project. You will be prompted to choose your preferred client.

```bash
cnhc graphql-client
```

### `cnhc config`

Configures default options for the CLI tool, such as default Hasura endpoint, schema path, and Codegen output directory. This creates a `.create-nuxt-hasura-cli.json` file in your project root.

```bash
cnhc config
```

## Development

To run the CLI tool in development mode:

```bash
pnpm dev
```

To build the project:

```bash
pnpm build
```

To run tests:

```bash
pnpm test