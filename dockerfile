# Base image
FROM node:20-alpine3.17

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
RUN npm install -g npm
RUN npm install -g serve
# Install app dependencies
RUN yarn

# Bundle app source
COPY . .
COPY ./src/roboto-font ./node_modules/pdfmake/roboto-font
RUN cd ./node_modules/pdfmake && node ./build-vfs.js "./roboto-font"
RUN cd ../..
RUN yarn build

EXPOSE 3000

# Start the server using the production build
CMD [ "serve", "-s", "dist" ]