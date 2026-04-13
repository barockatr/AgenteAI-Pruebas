FROM node:20-alpine

# Set the working directory for the agent code
WORKDIR /app

# Copy package configurations first to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies (ignoring scripts if any)
RUN npm install --ignore-scripts

# Copy the rest of the agent code
COPY . .

# Create the sandbox directory (this will be mounted via docker-compose)
RUN mkdir -p /app/sandbox

# Set permissions
RUN chown -R node:node /app

USER node

# By default, we run the agent. We can use `start:node` or directly `node chat.js`.
# However, for an interactive agent inside docker, docker-compose is better suited with tty.
CMD ["node", "chat.js"]
