# Stage 1: Build the Astro app
FROM node:current-alpine3.20 AS builder

WORKDIR /app

COPY package.json ./


# RUN npm install -g npm@latest
RUN npm install -g pnpm@latest
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm i



COPY . .

RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration if necessary
#COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
