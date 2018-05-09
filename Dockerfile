# https://github.com/ExiaSR/alpine-yarn-nginx
FROM exiasr/alpine-yarn-nginx

# Add build dependencies
RUN apk add --no-cache make gcc g++ python

COPY . /source
WORKDIR /source
RUN yarn install

# Remove them to keep image size small
RUN apk del make gcc g++ python

# Build and serve the site
CMD ["sh", "/source/.build_scripts/serve.sh"]