# Mongo Management

This project consists of a **backend** and a **frontend** for managing and visualizing data from a MongoDB database with a user-friendly interface.

## Setup Instructions

### 1. Backend
1. Navigate to the `backend/` folder.
2. Create a `.env` file and add your MongoDB connection string:
   ```env
   MONGO_URI=your_mongo_connection_string
Install dependencies:

bash
Copy code
npm install
Start the backend server:

bash
Copy code
npm run start
2. Frontend
Navigate to the dashboard/ folder.

Open src/config.js (or wherever the API base URL is defined).

Replace the API base URL with the IP/host where the backend is running.

Install dependencies:

bash
Copy code
npm install
Start the frontend:

bash
Copy code
npm run dev
Usage
After starting both the backend and frontend, open the frontend in your browser.

The UI will display your MongoDB collections and documents in a clean, user-friendly way.

Tech Stack
Backend: Node.js, Express, MongoDB

Frontend: React (Vite), modern UI tools
