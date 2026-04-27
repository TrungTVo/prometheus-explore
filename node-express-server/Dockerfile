FROM node:latest AS build
WORKDIR /usr/app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json build.sh ./
COPY src ./src
RUN npm run build

FROM node:latest
WORKDIR /usr/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /usr/app/dist ./dist
CMD ["npm", "run", "start:demo"]
