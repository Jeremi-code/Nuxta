# nuxta

A CLI tool to streamline the creation of Nuxt.js projects with integrated Hasura, GraphQL Codegen, and your choice of Apollo or Urql GraphQL client.

## Installation

To use this CLI tool, you need to have Node.js and pnpm installed.

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/nuxta.git
   cd nuxta
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

Once installed, you can use the `nuxta` command to access the following commands:

### `nuxta init <project-name>`

Initializes a new Nuxt.js project with the specified name.

```bash
nuxta init my-nuxt-app
```

### `nuxta codegen`

Integrates GraphQL Codegen into your Nuxt.js project. It will prompt for the path to your GraphQL schema file and the output directory for generated types.

```bash
nuxta codegen
```

### `nuxta get-schema`

Fetches the GraphQL schema from a specified endpoint and saves it to a file.

```bash
nuxta get-schema
```

### `nuxta graphql-client`

Integrates either Nuxt Apollo or Urql GraphQL client into your Nuxt.js project. You will be prompted to choose your preferred client.

- **Apollo**: Automatically installs `@nuxtjs/apollo`, creates the configuration file, and updates `nuxt.config.ts` to include the module and client configuration.
- **Urql**: Automatically installs `@urql/vue`, creates a plugin with authentication support, and updates `nuxt.config.ts` to expose the GraphQL endpoint via `runtimeConfig`.

```bash
nuxta graphql-client
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
```
