FROM node:24-slim AS builder

RUN npm i -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

ARG VITE_BASE_URL=/api
ENV VITE_BASE_URL=${VITE_BASE_URL}

RUN pnpm build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html