FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# TODO: Cambiar a start cuando se esté en producción
CMD ["npm", "run", "dev"]
