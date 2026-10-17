FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=7860

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev --legacy-peer-deps

COPY . .
RUN npm run build \
    && mkdir -p /app/.data \
    && chown -R 1000:1000 /app

USER 1000:1000
EXPOSE 7860

CMD ["npm", "start"]
