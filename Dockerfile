FROM node:24-slim AS builder

RUN npm i -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm i

COPY src src
COPY public public
COPY *.ts *.js *.json *.yaml *.yml *.html ./

ARG VITE_BASE_URL=/api
ENV VITE_BASE_URL=${VITE_BASE_URL}

RUN pnpm build

FROM nginx:alpine-slim

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist/ /var/www

