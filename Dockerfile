FROM node:24-slim AS builder

RUN npm i -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN HUSKY=0 pnpm install --frozen-lockfile

COPY . .

ENV VITE_BASE_URL=__VITE_BASE_URL__

RUN pnpm build
RUN mkdir -p /app/dist/monaco \
    && cp -r /app/node_modules/monaco-editor/min/vs /app/dist/monaco/vs

FROM nginx:alpine-slim

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY docker-entrypoint.d/inject-backend-url.sh /docker-entrypoint.d/

RUN chmod +x /docker-entrypoint.d/inject-backend-url.sh
