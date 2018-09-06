<h1 align="center">RAM Frontend</h1>

This repository contains the user interface of the Rural Accessibility Map, a tool that allows one to assess the accessibility of rural populations in relation to critical services. For more information and an overview of related repositories, please see [RAM Backend](https://github.com/WorldBank-Transport/ram-backend).

## Installation and Usage
The steps below will walk you through setting up a development environment for the frontend.

### Install Project Dependencies
To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) v8 (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
- [Yarn](https://yarnpkg.com/) Package manager

### Install Application Dependencies

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```
nvm install
```

Install Node modules:

```
yarn install
```

### Usage

#### Config files
The config files can be found in `app/assets/scripts/config`. After installing the project, there will be an empty `local.js` that you can use to set the config. This file should not be committed.

The configuration is overridable by environment variables, expressed between []:

- `api` - The address for the API. [API]
- `iDEditor` - The address of the iDEditor. Defaults to the `master` branch of the [RAM fork of iD](https://github.com/WorldBank-Transport/ram-id), hosted on GH Pages. (Default: https://id.ruralaccess.info). [IDEDITOR]
- `mbtoken` - The Mapbox Token to load map tiles from. [MBTOKEN]
- `rahUrl` - The url for the Rural Accessibility Hub. [RAH_URL]
- `auth` - The configuration for optional authentication with Auth0. By default, no authentication is set (Default: {})
- `auth.domain` - See instructions below [AUTH_DOMAIN]
- `auth.clientID` - See instructions below [AUTH_CLIENTID]
- `auth.redirectUri` - See instructions below [AUTH_REDIRECTURI]
- `auth.audience` - See instructions below [AUTH_AUDIENCE]

Example:
```
module.exports = {
  api: 'http://localhost:4000',
  idEditor: 'https://id.ruralaccess.info',
  mbtoken: 'asfd23rlmksjdf023rnnsafd',
  rahUrl: 'http://rah.surge.sh' 
  auth: {}
};
```

For authentication using Auth0, you must setup a client on Auth0 and get your client key. The API must also be setup as in the API section on Auth0.

The config should have the `auth` key with the following settings:
```
auth: {
  domain: '<Auth0 namespace>.auth0.com',
  clientID: <Auth0 client ID>
  redirectUri: 'http://localhost:3000/', # Or your deployment URL at the root
  audience: <API audience>
}
```

#### Starting the app

```
yarn serve
```
Compiles the sass files, javascript, and launches the server making the site available at `http://localhost:3000/`
The system will watch files and execute tasks whenever one of them changes.
The site will automatically refresh since it is bundled with livereload.

## Deployment
To prepare the app for deployment run:

```
yarn build
```
This will package the app and place all the contents in the `dist` directory.
The app can then be run by any web server.

### Docker
The RAM frontend is also available in a [Docker container](https://hub.docker.com/r/wbtransport/ram-frontend/). This container builds the site and serves the interface through nginx. [Environment variables](#config-files) will be picked up when the container is run:

``` yml
version: '3'
services:
  ram-frontend:
    image: wbtransport/ram-frontend
    environment:
      API: 'https://new.api.io'
    ports:
      - 8080:80
```

To run the full RAM stack in Docker, you can use the `docker-compose.yml` file that's available in the [RAM backend repo](https://github.com/WorldBank-Transport/ram-backend/blob/develop/docker-compose.yml).

### Releasing a new version
The process to release a new version:

- still on `develop`, bump the version in `package.json`
- set up PR, have somebody do a review and merge `develop` into `master`
- CircleCI will add a new tag to git using the version in `package.json`
- if the tagging was successful, CircleCI will build the Docker image, tag it with the version number and push it to Docker Hub. If the tagging failed (because the version wasn't updated in `package.json`), the build fails

Once this is done, you can [add a new release on Github](https://github.com/WorldBank-Transport/ram-frontend/releases/new) with useful notes that describe it.