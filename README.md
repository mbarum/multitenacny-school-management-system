# Saaslink School Management System

This is a modern, fully integrated school accounting and management system. The project is a full-stack application featuring a React frontend and a NestJS backend.

## Project Structure

-   `/` - Contains the React frontend application.
-   `/server` - Contains the NestJS backend application.

## Running the Application Locally

This guide explains how to run the frontend and backend directly on your machine, connecting to a local database (e.g., from XAMPP, WAMP, or a direct MySQL installation).

### Prerequisites
-   **Node.js** (v18 or newer)
-   **npm** (or another package manager)
-   **MySQL Server** running locally.

### Steps:

1.  **Backend Setup (Crucial for Data Persistence):**
    -   Navigate to the `server` directory: `cd server`
    -   Follow the **very detailed** instructions in the `server/README.md` file to connect to your database and seed it with initial data.
    -   Start the backend server by running `npm run start:dev` inside the `server` directory.

2.  **Frontend Setup:**
    -   In a **separate terminal**, navigate to the root directory of the project (if you were in the `server` directory, go back with `cd ..`).
    -   Install frontend dependencies: `npm install`
    -   Start the frontend development server: `npm run dev`

3.  **Access the Application:**
    -   The terminal will show you the local address, usually `http://localhost:5173`. Open this in your browser.

---

### Default Login Credentials
-   **Admin:** `admin@saaslink.com`
-   **Teacher:** `alice@saaslink.com`
-   **Parent:** `parent1@saaslink.com`
-   **Password (for all):** `password123`