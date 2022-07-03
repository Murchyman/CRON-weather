FROM node:18-alpine3.15
# manually installing chrome
RUN apk add chromium
# skips puppeteer installing chrome and points to correct binary
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
WORKDIR /app
COPY package.json .
RUN npm install --only=production
COPY . .
CMD ["node", "."]