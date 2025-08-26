# BONASO Data Portal Website: Setup
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
    FOR DEVELOPMENT (.env):
        - setup .env like this:
            ```
            NODE_ENV=development
            VITE_API_URL=
            ```
        NODE_ENV tells the system that this is a development environment, and will therefore use the proxy API url ([/vite.config.js]) for all API requests. Setting VITE_API_URL equal to nothing makes sure that the API calls are not prefixed with a domain name, since this is managed via the proxy API url. 
        
    FOR PRODUCTION (.env.production):
        - setup .env.production like this:
            ```
            VITE_API_URL=https://your-domain.com
            ```
        VITE_API_URL will prefix all API calls. 

---

## 3. Initiate the App
For dev, run 
```bash
npm run dev
```

For prudction run 
```bash
npm run build