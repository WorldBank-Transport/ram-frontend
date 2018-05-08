# https://github.com/ExiaSR/alpine-yarn-nginx
FROM exiasr/alpine-yarn-nginx

# Add build dependencies
RUN apk add --no-cache make gcc g++ python

ADD . /source
WORKDIR /source
RUN yarn install

# Remove them to keep image size small
RUN apk del make gcc g++ python
