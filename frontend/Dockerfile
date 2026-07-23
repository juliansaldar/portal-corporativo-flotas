# Dev server para MVP local (ver design.md de web-portal-dashboard: no hay build de produccion)
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
