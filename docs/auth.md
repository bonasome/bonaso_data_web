# BONASO Data Portal Website: Authentication Overview:

---

The BONASO Data Portal Server handles most of the legwork for authentication, but the frontend has a complementary system to improve the user experience. 

---

## Token Management Principles
The authentication system relies on HTTP cookies that store access and refresh tokens sent by the server. The frontend never directly interacts with these refresh tokens, it sends them with requests them via fetch's include headers (this helps prevent cross site scripting attacks). 

These tokens are required to be sent with all API requests (save for logging in). If a user does not have a valid access token, then the frontend will try to use the refresh token to get a new one (see FETCH WITH AUTH below). If the user does not have a valid refresh token, they will be signed out. Without the refresh token, the backend will reject all of their requests. 

---

## Auth Redirects
Whenever a user is signed out/logs out, they will be taken to the **login** page [src/components/auth/Login.jsx]. If they try to enter any other url, they will be redirected to the login page via the RedirectIfNotAuth wrapper at [src/authRedirect/RedirectIfNotAuth.jsx]. Conversely, if a user is logged in and tries to navigate to the login page, they will be redirected to the home page via the RedirectIfAuth wrapper at [src/authRedirect/RedirectIfAuth.jsx]. 

In [src/routes/Routes.jsx], some urls have a RedirectIfNoPerm wrapper found at [src/authRedirect/RedirectIfNoPerm] that will redirect them away from a page they do not have permission to view. 

---

## Fetch With Auth
Virtually all api requests (except for logging in) should be wrapped in the **fetchWithAuth** helper function located at [services/fetchWithAuth.js]. This function will attempt to call the API, but if the access token is expired and a refresh token is present, it will automatically try to get a new refresh then retry the API call. This simplifies the process by assuring that requests do not fail due to an expired access token, holds simultanous requests until a refresh token is found, and also slightly simplifies the request code since if automatically includes headers (necessary for the cookie JWT system).

The fetchWithAuth process is:
    1. The user makes a request.
    2. If the access token is expired, fetchWithAuth calls the refresh function (located at [src/contexts/UserAuth.jsx])
        - If this happens during an API request (i.e., not preemptively, it will trigger a global loading state to prevent issues while pages are rendering)
        - If any further requests are made while the refresh token is being fetched, they will be halted until the refresh token is found to prevent race conditions.
    3. Once the new refresh token is found, the request will be tried again.

Note: The site tries its best to fetch the refresh token preemptively (every 4 minutes, one minute before the access token expires) so that the user does not notice that the refresh token expires, since it adds extra loading time. This interval is managed at [src/contexts/UserAuth.jsx].

---

