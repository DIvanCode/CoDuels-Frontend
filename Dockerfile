FROM node:24-slim AS builder

RUN npm i -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN HUSKY=0 pnpm install --frozen-lockfile

COPY . .

RUN mkdir -p /app/public/fonts /app/third-party/inter
ADD https://raw.githubusercontent.com/rsms/inter/353b61b9f4430d5f420d56605a6e7993e0941470/docs/font-files/InterVariable.woff2 /app/public/fonts/InterVariable.woff2
ADD https://raw.githubusercontent.com/rsms/inter/353b61b9f4430d5f420d56605a6e7993e0941470/docs/font-files/InterVariable-Italic.woff2 /app/public/fonts/InterVariable-Italic.woff2
ADD https://raw.githubusercontent.com/rsms/inter/353b61b9f4430d5f420d56605a6e7993e0941470/LICENSE.txt /app/third-party/inter/LICENSE.txt

ENV VITE_BASE_URL=__VITE_BASE_URL__

RUN pnpm build
RUN mkdir -p /app/dist/monaco \
    && cp -r /app/node_modules/monaco-editor/min/vs /app/dist/monaco/vs

FROM nginx:alpine-slim

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY --from=builder /app/third-party/inter/LICENSE.txt /usr/share/licenses/inter/LICENSE.txt
COPY docker-entrypoint.d/inject-backend-url.sh /docker-entrypoint.d/

RUN chmod +x /docker-entrypoint.d/inject-backend-url.sh
