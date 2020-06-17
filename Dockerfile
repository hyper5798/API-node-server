FROM node:14.4.0-alpine
WORKDIR /app
COPY package*.json ./ 
RUN npm install
COPY . .
EXPOSE 3010
CMD ["node","index.js"]