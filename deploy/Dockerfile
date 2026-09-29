FROM node:22-alpine AS build
RUN apk update && apk add python3
WORKDIR /app
COPY . ./
RUN npm install
RUN npm run build

FROM nginx:stable-alpine3.17-slim
COPY --from=build /app/dist/spa /usr/share/nginx/html/
EXPOSE 80
