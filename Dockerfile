FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssh-client rsync ca-certificates tar && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 5780 5781
CMD ["npm", "run", "dev"]
