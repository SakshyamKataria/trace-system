FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start the dev server
CMD ["npm", "run", "dev"]
