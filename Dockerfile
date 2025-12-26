# Multi-stage Dockerfile for building and serving the Vite React app
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
RUN npm ci --silent
COPY . ./
RUN npm run build

FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
# Copy a custom nginx config from the build stage if provided.
# Note: Dockerfile does not support shell redirection or conditionals
# inside the COPY instruction. If the file does not exist the build
# will fail — add the file in the build stage if you need a custom
# nginx config.
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
