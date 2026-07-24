# Vite bakes VITE_* env vars in at build time, so they're passed as build
# args here rather than read at container start. Pass them via
# `docker build --build-arg` or docker-compose's `args:`.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE
ARG VITE_ORS_KEY
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_ORS_KEY=$VITE_ORS_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
