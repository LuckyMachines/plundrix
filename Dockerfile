FROM node:20-bookworm-slim AS frontend-build

ARG NODE_ENV
WORKDIR /workspace
COPY app/package.json app/package-lock.json ./app/
RUN npm --prefix app ci --include=dev
COPY app ./app

ARG VITE_AGENT_SERVICE_URL
ENV VITE_AGENT_SERVICE_URL=$VITE_AGENT_SERVICE_URL
RUN npm --prefix app run build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production PORT=8080 AGENT_PORT=8787
WORKDIR /workspace
RUN apt-get update \
  && apt-get install --yes --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY abi ./abi
COPY agent-service ./agent-service
COPY app/scripts/serve-dist.mjs ./app/scripts/serve-dist.mjs
COPY app/src/lib ./app/src/lib
COPY app/src/data ./app/src/data
COPY --from=frontend-build /workspace/app/dist ./app/dist
COPY scripts/start-production.mjs ./scripts/start-production.mjs

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "scripts/start-production.mjs"]
