# --- Build stage ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
# Use npm install when lock file is out of sync with package.json (e.g. after adding deps).
# For reproducible builds, run `npm install` in frontend and commit package-lock.json, then use: RUN npm ci
RUN if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi

COPY . .
# Build with empty VITE_API_URL so the app uses relative URLs; nginx will proxy /v1 and /health to the API
ENV VITE_API_URL=
RUN npm run build

# --- Production stage: nginx serves SPA and proxies API ---
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
