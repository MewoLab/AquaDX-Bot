FROM node:22-slim AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json /app/
COPY patches /app/patches
COPY apps/qqbot/package.json /app/apps/qqbot/
COPY packages/botcore/package.json /app/packages/botcore/
COPY packages/botfirm/package.json /app/packages/botfirm/
COPY packages/clients/package.json /app/packages/clients/
COPY packages/data/package.json /app/packages/data/
COPY packages/types/package.json /app/packages/types/
COPY packages/utils/package.json /app/packages/utils/
COPY packages/adapters/package.json /app/packages/adapters/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store,sharing=locked \
    --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm i -g pnpm@9.15.2 && \
    pnpm install --frozen-lockfile

COPY packages /app/packages

RUN #cd /app/packages/adapters/ && pnpm run build

COPY apps/qqbot /app/apps/qqbot

RUN cd /app/apps/qqbot && pnpm run build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store,sharing=locked \
    --mount=type=secret,id=npmrc,target=/root/.npmrc \
    pnpm deploy --filter=@clansty/maibot-onebot --prod deploy

FROM node:22-slim

RUN rm -f /etc/apt/apt.conf.d/docker-clean; echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  apt update \
    && apt-get --no-install-recommends install -y curl gnupg gosu libxss1 software-properties-common apt-transport-https ca-certificates  \
    && curl -fSsL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor | tee /usr/share/keyrings/google-chrome.gpg \
    && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
      --no-install-recommends

WORKDIR /app
COPY --from=build /app/deploy /app

COPY apps/qqbot/docker-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/google-chrome-stable

CMD /app/entrypoint.sh
