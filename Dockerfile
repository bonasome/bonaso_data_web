# -------------------------
# STAGE 1: build React app (with node v22)
# Note that the frontend is not a docker container, but rather is served through Nginx.
# This file builds the site automatically for Nginx
# -------------------------
FROM node:22 AS builder 

WORKDIR /app

# Copy only package files first for caching
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source
COPY . . 
RUN npm run build

# -------------------------
# STAGE 2: Serve with Nginx
# -------------------------
FROM nginx:alpine

# Copy built app to Nginx HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if you have one
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose nginx port (should match nginx.conf and docker-compose.yaml)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]