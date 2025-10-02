# Stage 1: build React app
FROM node:22 AS builder

WORKDIR /app

# Copy only package files first for caching
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source
COPY . . 
RUN npm run build

# Stage 2: serve with Nginx
FROM nginx:alpine

# Copy built app to Nginx HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if you have one
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]