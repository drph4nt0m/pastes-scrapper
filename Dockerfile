# FROM node:slim

# # Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# # Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# # installs, work.
# RUN apt-get update \
#     && apt-get install -y wget gnupg \
#     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#     && apt-get update \
#     && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
#       --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

# # If running Docker >= 1.13.0 use docker run's --init arg to reap zombie processes, otherwise
# # uncomment the following lines to have `dumb-init` as PID 1
# # ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_x86_64 /usr/local/bin/dumb-init
# # RUN chmod +x /usr/local/bin/dumb-init
# # ENTRYPOINT ["dumb-init", "--"]

# # Uncomment to skip the chromium download when installing puppeteer. If you do,
# # you'll need to launch puppeteer with:
# #     browser.launch({executablePath: 'google-chrome-stable'})
# # ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true




FROM zenika/alpine-chrome:with-puppeteer

# Installs latest Chromium (92) package.
# RUN apk add --no-cache \
#       nodejs \
#       npm


WORKDIR /app

COPY package*.json /app/

# Install puppeteer so it's available in the container.
RUN npm i

CMD ["chromium-browser", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]