# Dockerfile
# Use an official Node.js runtime as the base image
FROM node:22.1.0
USER root

RUN apt-get update
USER 1000
WORKDIR /usr/src/app
# Copy package.json and package-lock.json to the container
COPY --chown=1000 package.json package-lock.json ./

# Copy the rest of the application files to the container
COPY --chown=1000 . .

# Install dependencies and build the application
RUN npm install
RUN npm run build

# Expose the application port (specified in the config)
EXPOSE 5173

# Start the application with the server.js script
CMD ["node", "server.js"]