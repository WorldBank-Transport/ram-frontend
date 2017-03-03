FROM nginx:stable-alpine

# Copy the built site to the Nginx config
COPY ./dist /usr/share/nginx/html

# Remove the default Nginx config
RUN rm -v /etc/nginx/conf.d/default.conf

# Copy the config
ADD nginx.conf /etc/nginx/conf.d/rra.conf
ADD .htpasswd /etc/nginx/