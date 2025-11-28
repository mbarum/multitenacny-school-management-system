# Saaslink Backend Server

This directory contains the NestJS backend. Follow these steps to run the server locally. Following these instructions carefully is **critical** to ensure your data is saved permanently.

## Local Setup

### 1. Install Dependencies
Navigate into this `server` directory and run:
```bash
npm install
```

### 2. Set Up Environment Variables (The Most Important Step)

This step connects the backend to your database. **If this is done incorrectly, your data will disappear every time you refresh or restart the server.**

1.  In this `server` directory, create a new file named `.env`.
2.  Copy the entire content from the `server/.env.example` file and paste it into your new `.env` file.
3.  **Edit your new `.env` file with your XAMPP/MySQL settings:**
    *   `MYSQL_HOST`: Should be `localhost`.
    *   `MYSQL_PORT`: Should be `3306` (this is the default for MySQL).
    *   `MYSQL_USER`: Usually `root` for a default XAMPP installation.
    *   `MYSQL_ROOT_PASSWORD`: **If your XAMPP MySQL `root` user has no password, you MUST leave this blank:** `MYSQL_ROOT_PASSWORD=`. This is the most common reason for connection failure. If you have set a password, enter it here.
    *   `MYSQL_DATABASE`: The name for your database, e.g., `saaslink_db`.
    *   `JWT_SECRET`: Change this to any long, random string.
    *   `API_KEY`: Add your Google Gemini API key.

### 3. Create the Database

The application can create tables, but it cannot create the database itself.

1.  Open your MySQL management tool (e.g., phpMyAdmin from the XAMPP control panel).
2.  Create a new, empty database. **It must have the exact same name** you used for `MYSQL_DATABASE` in your `.env` file (e.g., `saaslink_db`).

### 4. Seed the Database

This command will connect to the database you just created, build all the necessary tables, and fill them with initial mock data.

```bash
npm run seed
```
If this command fails, it is almost certainly because the database details in your `.env` file are incorrect. Double-check them.

### 5. Run the Server

-   **Development Mode (with hot-reloading):**
    ```bash
    npm run start:dev
    ```
    The server will start on `http://localhost:3000`. Any data you add in the application will now be saved to your local MySQL database and will be there after a refresh.