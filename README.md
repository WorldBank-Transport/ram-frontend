<h1 align="center">RAM Frontend</h1>

This repository contains the user interface of the Rural Accessibility Map, a tool that allows one to assess the accessibility of rural populations in relation to critical services. For more information and an overview of related repositories, please see [RAM Backend](https://github.com/WorldBank-Transport/ram-backend).

## Installation and Usage
The steps below will walk you through setting up a development environment for the frontend.

### Install Project Dependencies
To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) v6 (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))
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
All the config files can be found in `app/assets/scripts/config`.
After installing the projects there will be 3 main files:
  - `local.js` - Used only for local development. On production this file should not exist or be empty.
  - `staging.js`
  - `production.js`

The `production.js` file serves as base and the other 2 will override it as needed:
  - `staging.js` will be loaded whenever the env variable `DS_ENV` is set to staging.
  - `local.js` will be loaded if it exists.

The following options must be set: (The used file will depend on the context):
  - `api` - The address for the rra api

Example:
```
module.exports = {
  api: 'http://localhost:4000'
};
```

#### Authentication with Auth0
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
yarn run serve
```
Compiles the sass files, javascript, and launches the server making the site available at `http://localhost:3000/`
The system will watch files and execute tasks whenever one of them changes.
The site will automatically refresh since it is bundled with livereload.

# Deployment
To prepare the app for deployment run:

```
yarn run build
```
This will package the app and place all the contents in the `dist` directory.
The app can then be run by any web server.
