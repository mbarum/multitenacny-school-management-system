FROM node:20-alpine

WORKDIR /usr/src/app

# Install build dependencies (python, make, g++ if needed for native modules like bcrypt)
RUN apk add --no-cache python3 make g++

# Copy server package definitions
COPY server/package*.json ./

# Install server dependencies
RUN npm install

# Copy server source code
COPY server/ .

# Build NestJS application
RUN npm run build

# Expose API port
EXPOSE 3000

# Start NestJS production server
CMD ["node", "dist/main"]
