# Aegios Control Center - Frontend Documentation

This document provides a comprehensive overview of the `aegios-control-center-main` frontend project, detailing its architecture, components, state management, routing, and setup instructions.

## 1. Project Overview
The **Aegios Control Center** frontend is a modern single-page application (SPA) built to interface with the Aegios backend services, specifically for executing fetching services and viewing Kubernetes security postures.

**Core Technologies:**
*   **Framework:** React 18
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** Shadcn UI (built on Radix UI primitives)
*   **State Management & Data Fetching:** React Query (@tanstack/react-query)
*   **Routing:** React Router v6
*   **Form Management:** React Hook Form with Zod validation
*   **Charts:** Recharts

## 2. Directory Structure (`src/`)
The project follows a feature-grouped, flat directory structure underneath `src/`:

*   **`components/`**: Reusable React components.
    *   `ui/`: Generic, stylistic Shadcn UI components (buttons, dialogs, inputs, etc.).
    *   `security/`: Domain-specific components for the Kubernetes security features.
    *   *Layouts*: Includes layout wrappers like `GlobalLayout.tsx`, `DashboardHeader.tsx`, and `ProtectedRoute.tsx`.
*   **`contexts/`**: React Context providers for global state management.
    *   `AuthContext.tsx`: Manages authentication state, login/signup flows, and session storage.
    *   `SecurityContext.tsx`: Manages the state and data fetching for the Kubernetes security posture and actions.
*   **`pages/`**: Top-level route components representing full pages.
    *   `auth/`: `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPasswordPage.tsx`.
    *   `security/`: `K8sScorePage.tsx`, `K8sPostureLanding.tsx`, `K8sActionLanding.tsx`, etc.
    *   `Index.tsx`: The main dashboard page for the fetching service.
*   **`lib/`**: Utility functions and core helpers.
    *   `api-client.ts`: Custom HTTP client wrapper over `fetch` featuring built-in timeouts, exponential backoff retries, and standardized error handling.
    *   `data-transformers.ts`: Utility for token management and data conversion.
    *   `utils.ts`: General helper functions (like `cn` for Tailwind class merging).
*   **`config/`**: Configuration constants.
    *   `api.ts`: Central registry for backend API endpoint URIs.
*   **`hooks/`**: Custom React hooks for shared logic.
*   **`App.tsx`**: Root component responsible for setting up context providers and the React Router configuration.
*   **`main.tsx`**: Application entry point that mounts the React tree to the DOM.

## 3. State Management & Data Fetching
The application uses a hybrid approach for state management:

1.  **React Context for Global UI/App State**: 
    *   `AuthContext` provides access to the current `user` object and `isAuthenticated` boolean across the app.
    *   `SecurityContext` provides a unified interface for the security dashboard metrics, ensuring components like the Score Page and Posture Landing stay synchronized.
2.  **React Query for Server State**:
    *   Used extensively for data fetching, caching, and background updates. The `QueryClientProvider` wraps the application in `App.tsx`.
3.  **Event-driven Updates**:
    *   The app dispatches custom DOM events (e.g., `window.dispatchEvent(new Event('aegios:login'))`) to force-refresh specific contexts when the authentication state changes.

## 4. Routing & Layouts
Routing is handled by **React Router DOM** and configured in `App.tsx`:

*   **Public Routes**: Under `/authentication/*` for login, signup, and password reset.
*   **Protected Routes**: Wrapped by the `<ProtectedRoute />` component which navigates unauthenticated users back to login. 
    *   `/fetching-service/*`: Default landing dashboard. Uses `GlobalLayout`.
    *   `/security-service/*` & `/security/*`: Uses nested layouts combining `GlobalLayout` and `SecurityLayout`. Includes routes for Posture, Actions, and Security Score.
*   **Redirects**: The root path (`/`) automatically redirects to `/authentication/login`.

## 5. Security & Authentication Flow
1.  **Login**: The user submits GitHub credentials via the `LoginPage`.
2.  **API Call**: `AuthContext.login` makes a POST request to the backend auth endpoint.
3.  **Session Storage**: On success, the backend returns a session token and user data. The token is stored via helpers in `lib/data-transformers.ts`, and the user state is persisted in `localStorage` under the key `aegios_user`.
4.  **Authorized Requests**: Subsequent API calls utilize the `getSessionToken()` utility to attach the authorization token.
5.  **Logout**: Clears local storage and removes the token, navigating the user out of protected routes.

## 6. Development & Deployment
The project is bootstrapped with Vite, making local development fast.

**Scripts:**
*   `npm run dev`: Starts the local Vite development server.
*   `npm run build`: Compiles the TypeScript code and builds the production bundle via Vite.
*   `npm run lint`: Runs ESLint to check for code quality issues.
*   `npm run preview`: Locally previews the production build.

**Styling & UI:**
The UI heavily leverages Tailwind CSS for utility-first styling, merged dynamically using the `clsx` and `tailwind-merge` libraries (usually via a `cn` utility function). Most complex interactive components (like Dialogs, Selects, and Tabs) are primitive components from Radix UI styled with Tailwind (Shadcn UI approach).
