# BONASO Data Portal Website: Setup

This quickstart guide will get the frontend web UI set up. Please make sure to also setup the [server](https://github.com/bonasome/bonaso_data_server) and the [mobile](https://github.com/bonasome/bonaso_data_mobile) app as well. *The web UI will not work if the server is not set up!*

---

## 1. Requirements
- Node.js (v18+ recommended)
- npm (comes with Node.js) or Yarn

On first setup, run:

```bash
npm install
```

to install all requirements.

---

## 2. Setup .env/.env.production
### Development (.env):
Setup `.env` like this:

```bash
NODE_ENV=development
VITE_API_URL=
```

NODE_ENV tells the system that this is a development environment, and will therefore use the proxy API [url](/vite.config.js) for all API requests. 

Setting VITE_API_URL equal to "nothing" makes sure that the API calls are not prefixed with a domain name, since this is managed via the proxy API url. 

### Production (.env.production):
Setup `.env.production` like this (unless you are proxying the API, if so, also set it as an empty string):

```bash
VITE_API_URL=https://your-domain.com
```
VITE_API_URL is the prefix for the server and will prefix all API calls. 

---

## 3. Initiate the App
For dev, run:

```bash
npm run dev
```

For production run:

```bash
npm run build