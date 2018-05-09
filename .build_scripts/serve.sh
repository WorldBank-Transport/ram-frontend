#!/usr/bin/env bash
set -e # halt script on error

# This scripts builds the site and moves it to the Nginx folder.
# To be run as a command in docker-compose

# Build the site
if [[ $DS_ENV == 'offline' ]]; then
  echo 'Building version for offline use'
  yarn build-offline
else
  echo 'Building production version'
  yarn build
fi

# Clean default nginx content
rm -r /usr/share/nginx/html/*
mv ./dist/* /usr/share/nginx/html

# Make sure nginx stays up once the container is done
echo "daemon off;" >> /etc/nginx/nginx.conf || true

echo 'Starting nginx, access the RAM frontend through your browser.'

# Start nginx
nginx

