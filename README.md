# New Numerology backend

## Prerequisite

- VS Code's extensions:
  - EditorConfig
  - TODO Highlight
  - ESLint
  - Code Spell Checker

- Pnpm

## Tools:
- MongoDB Compass: access the local dev MongoDB database

## Note

- Use `pnpm` instead of `yarn`.
- Don't forget to commit `pnpm-lock.yaml` when you are adding new packages.

## How to Start

- Create `.env` from `.env.example` with your own modifications:

```sh
cp .env.example .env
```

- Create `.env.api.docker.local` from `.env.api.example` with your own modifications:

```sh
cp .env.example .env
```

- Install app dependencies:

```sh
pnpm install
```

- Install Husky:

```sh
pnpm prepare
```

- Start the development server with docker compose:

```sh
docker compose -f docker-compose.local-dev.yml up -d --build
```

- Execute the server service:

```sh
docker compose exec new_numerology_api_dev sh
```

- Start the development server:

```sh
pnpm dev
```

## Other commands

- `pnpm prepare`: Install Husky.
- `pnpm ts-check`: Validate types of TypeScript files.
- `pnpm lint`: Report linting issues for TypeScript files.
- `pnpm lint-style`: Report linting issues for SASS files.
- `pnpm prettier --config .prettierrc 'src/**/*.{ts,tsx}' --write`: Format code on `src` directory.
- `pnpm prettier --config .prettierrc 'pages/**/*.{ts,tsx}' --write`: Format code on `pages` directory.
