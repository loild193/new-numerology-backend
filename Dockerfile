FROM node:16-alpine AS pre-base

RUN apk add --no-cache libc6-compat git

WORKDIR /app

ENV HUSKY=0 CI=true

# Install dependencies based on the preferred package manager
COPY package.json .npmrc pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ----------------------------------------
FROM pre-base AS build

WORKDIR /app

COPY --from=pre-base /app/node_modules ./node_modules
COPY . .

RUN pnpm i && pnpm build

# ----------------------------------------
FROM pre-base as release

WORKDIR /app

ENV NODE_ENV production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S koajs -u 1001

COPY --from=build --chown=koajs:nodejs /app /app

EXPOSE 9090

CMD ["pnpm", "start"]

# ----------------------------------------
FROM build AS builder

EXPOSE 9090

CMD ["tail", "-f", "/dev/null"]
