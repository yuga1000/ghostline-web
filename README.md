# Ghostline Web

This repository contains the static files for the Ghostline web site.  The site can be hosted on [Railway](https://railway.app/) using the Node `serve` package.

## Running locally

Install dependencies and start the server on port `8080`:

```bash
npm install
npm start
```

## Deploying to Railway

1. Connect this repository to Railway and enable deployments from the `main` branch.
2. Railway will automatically run `npm start`, which serves the site on port `8080` with no build step.

The application exposes the static content directly from this repository.
