# ⚡ Real-Time Socket Chat (Google Auth)

A high-performance, real-time chat application featuring secure **Gmail Login** integration. This project demonstrates how to bridge [Google OAuth 2.0](https://developers.google.com) with [Socket.io](https://socket.io) event handling.

---

## 🚀 Features

*   **🔒 Secure Gmail Login**: One-tap authentication via Google Cloud.
*   **📡 Real-Time Sync**: Instant message delivery with zero latency.
*   **🟢 Presence Tracking**: Live indicators for online/offline status.
*   **💬 Private & Group Rooms**: Dynamic room creation using Socket `join()`.
*   **⌨️ Typing Notifications**: UX-friendly "User is typing..." updates.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React TSX / CSS |
| **Backend** | [Node.js](https://nodejs.org) & Express |
| **Real-time** | [Socket.io](https://socket.io) |
| **Auth** | [Passport-Google-OAuth20](http://www.passportjs.org) |

---

## 🔑 Environment Setup

To get this running, you'll need to grab your credentials from the [Google Cloud Console](https://console.cloud.google.com). Create a `.env` file in the root directory:

```env
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
CALLBACK_URL=http://localhost:5000/auth/google/callback
PORT=5000



![Register page](/frontend/public/assets/Register.png)
![Login](/frontend/public/assets/Login.png)
![Main Screen](/frontend/public/assets/Mainscreen.png)
