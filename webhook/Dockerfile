FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production || npm install --production
COPY . .
ENV PORT=8082
EXPOSE 8082
CMD ["npm","start"]
