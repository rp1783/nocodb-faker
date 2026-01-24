FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY *.js ./
COPY .env.example ./

# Expose port
EXPOSE 3000

# Start the API wrapper
CMD ["npm", "run", "api"]
