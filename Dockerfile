FROM node:20-slim

# Set the working directory for the agent code
WORKDIR /app
RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

# Copy package configurations first to leverage Docker cache
COPY package*.json ./

# Install dependencies (ignoring scripts if any)
RUN npm install 

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
