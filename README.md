# Company Anniversary Voting System

A real-time voting system for company anniversary event performances with mobile voting interface and big screen display.

## Features

- 📱 Mobile H5 voting interface with QR code login
- 🖥️ Big screen real-time display with animations
- 🏆 5-dimension scoring system (台风/表演/人气/默契/创意)
- 📊 Real-time rankings and statistics
- 🔐 Anti-cheating mechanisms and security
- 👨‍💼 Admin panel for event management

## Project Structure

```
galass/
├── backend/           # Node.js API server
├── frontend/
│   ├── mobile/        # Vue3 + Vant mobile H5 app
│   └── bigscreen/     # Vue3 + ECharts big screen display
├── database/          # MySQL schema and migrations
└── docs/             # Documentation
```

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Mobile Frontend
```bash
cd frontend/mobile
npm install
npm run dev
```

### Big Screen Display
```bash
cd frontend/bigscreen
npm install
npm run dev
```

## Tech Stack

- **Backend**: Node.js + Express + PostgreSQL + Redis + WebSocket
- **Mobile**: Vue3 + Vant UI + Axios
- **Big Screen**: Vue3 + ECharts + WebSocket
- **Database**: PostgreSQL + Redis

## Development Team

Built for company anniversary celebration - voting system for performance evaluation.