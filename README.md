# Real-Time Collaborative Kanban Board Application

A full-stack, real-time collaborative Kanban board designed for seamless task management across team workspaces. This application features an interactive UI layout, automated status updates, and user role contexts.

##  Features

*   Interactive Workspace Panel: Dynamically switch across active project boards.
*   Intuitive Form UI: Simplified credential interfaces for secure, clean client-side layout management.
*   Automated Status Boards: Clean vertical column setups separating to-do elements, ongoing operations, and finished milestones.
*   Robust Error Feedback: Integrated alert banners displaying instant notifications for underlying API exceptions or network dropouts.

---

##  Tech Stack

*   Frontend: React.js, HTML5, CSS3 (Flexbox/Grid layout frameworks)
*   Backend Interface: Node.js, Express REST API architecture
*   Database Layers: Sqlite3

---

##  Installation & Setup

Follow these steps to spin up both client-side and backend environments on your local machine:

### 1. Clone the Repository
bash
git clone https://github.com
cd Real-Time-Collaborative-Kanban-Board-Ass


### 2. Configure the Backend Server
Open a separate terminal window and navigate to the backend directory:

cd backend
npm install
node server.js

The backend API listener will start up, serving endpoint data on port 5000.

### 3. Configure the Frontend Interface
Open another separate terminal window and configure your UI client:

cd frontend
npm install
npm start

This compiles your build and launches the React client application automatically at http://localhost:3000.

---

##  Demo Logins

To log in and explore the interactive features, use either of the test email footprints below. Any password text will grant interface access during local sandbox testing:

*   Account A: anish@acme.com
*   Account B: sana@acme.com
