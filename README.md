# BONASO Data Portal Website

**Tech stack:** React + Vite 

**Deployment:** Dockerized (served via Nginx container in production)  

**Environments:** Development, Production  

---

## 1. Project Overview
The **BONASO Data Portal** enables community health workers and coordinators to capture and analyze client and project data from across the country in real time. It is a network of tools that work together to collect and retrieve data on the web and mobile applications.

This document specifically describes the **frontend website**. For additional context, please also read the documentation for:  
- [**Backend:**](https://github.com/bonasome/bonaso_data_server) BONASO Data Portal Server (Django + PostgreSQL)  
- [**Mobile:**](https://github.com/bonasome/bonaso_data_mobile) BONASO Data Portal Mobile (React + Expo)  

The frontend website provides the user interface for recording and viewing data. It does not store data directly but communicates with the backend through authenticated API requests.

---

## 2. Project Architecture
- **PostgreSQL (database)**
- **Django (backend / API server)**
- [**React (frontend / website)**](https://github.com/bonasome/bonaso_data_web)
        - [**Expo + React Native (mobile application)**](https://github.com/bonasome/bonaso_data_mobile)

The frontend:
- Is built with **React + Vite**.  
- Retrieves most data from the backend via **REST APIs**.  
- Submits all new or updated data back to the server through these APIs.  

Most apps/pages follow a common structure:  
- **Index**: Paginated, searchable, and (usually) filterable lists.  
- **Detail**: Full details about a specific item.  
- **Create/Edit**: Forms for creating or editing items (typically share the same component with an optional `id` param), it may also be a modal component as opposed to a full page for some views.  

See [`sitemap.md`](/docs/sitemap.md) for a full outline of routes and features.  

---

## 3. Important Folders
- **/nginx** – contains an nginx.conf file (used for Docker builds, see the [bonaso_data_portal](https://github.com/bonasome/bonaso_data_portal) repository for more information on Docker builds). Can be ignored for dev/non-docker builds.
- **/src** – main code for the website:
  - **/assets** – images and static resources  
  - **/components** – reusable UI components  
  - **/contexts** – React contexts for global/shared state  
  - **/routes** – frontend route definitions (not the same as backend API routes)  
  - **/styles** – CSS styles shared across components  
- **/services** – helper and API functions (e.g., authenticated fetch utilities)  
- **/tests** – contains Playwright e2e integration tests
- **/theme** – style tokens and theme definitions (aligns with `/src/styles/tokens`) 

- [**App.jsx**](/src/App.jsx) - The central app file, any context wrappers (except UserAuth) must be placed here

> **Note:** Environment variables for API URLs, keys, etc. should be placed in a `.env` file (see [`setup.md`](/docs/setup.md)).

---

## 4. Next Steps
- [Setup](/docs/setup.md)
- [Sitemap](/docs/sitemap.md)
- [HelperFunctions](/docs/services.md)
- [Components](/docs/components.md)

For local development, follow the instructions in this repository.  

For production builds with Docker, see [bonaso_data_portal](https://github.com/bonasome/bonaso_data_portal), which combines the frontend and backend.
---

## Quick Start (Development)
```bash
# Install dependencies
npm install

# Start dev server
npm run dev