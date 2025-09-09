FROM node:18-bullseye
WORKDIR /app

# 👇 build tools en Debian
RUN apt-get update \
 && apt-get install -y python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .
ENV PORT=8081
EXPOSE 8081
CMD ["npm","start"]
