# Use a base image with Node.js and Python
FROM node:14-slim

# Install Python 3 and essential packages
RUN apt-get update && apt-get install -y python3 python3-pip
RUN apt-get install -y git

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json for npm installation
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy requirements.txt for pip installation
COPY requirements.txt ./

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Copy the rest of the application files
COPY . .

# Run the build.sh script
CMD ["bash", "container-script.sh"]