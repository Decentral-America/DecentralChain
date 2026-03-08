FROM node:24-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build:prod

FROM nginx:stable-alpine
RUN rm -rf /etc/nginx/conf.d/*
COPY --from=build /app/etc/nginx /etc/nginx/conf.d
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

COPY launch.sh ./
RUN chmod +x launch.sh
CMD ["./launch.sh"]
