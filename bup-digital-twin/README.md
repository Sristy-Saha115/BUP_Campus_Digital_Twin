# BUP Digital Twin (React + Node.js + Express + MongoDB)

```
bup-digital-twin/
├── package.json          root scripts (dev / seed / build)
├── server/               Express API + MongoDB (Mongoose)
│   ├── server.js  seed.js  .env.example
│   ├── config/ models/ routes/ middleware/
└── client/               React (Vite) app
    ├── public/img/       bup.jpg  (put your photo here), clubs-bg.jpg (optional), clubs/<slug>.jpg (optional)
    └── src/              pages/ components/ i18n.jsx config.js styles.css
```

## Run it
1. Install Node.js 18+ and MongoDB Community Server (or use a free MongoDB Atlas URI).
2. `copy server\.env.example server\.env` (edit `MONGODB_URI` / `JWT_SECRET` if needed)
3. `npm install` then `npm run install:all`
4. `npm run seed`  (loads the 9 clubs, sample faculty, search places, placeholder scholarship)
5. `npm run dev`  → open http://localhost:5173  (API on :5000)

## Things YOU must fill in
- `client/public/img/bup.jpg` – move it from your old `static/img/`.
- `client/src/config.js` → `HOME_VIDEO_ID` (already set to qv7C_yp3h5E), `CAMPUS_CENTER` (verify coordinates).
- Club photos (optional): `client/public/img/clubs/<slug>.jpg` where slug = robotics, programming, infotech, law, finance, media, literature, career, development; and `client/public/img/clubs-bg.jpg` for the section background. Without them, coloured club-themed gradients are used.
- Replace placeholder faculty / places / scholarship in `server/seed.js` with verified data, then `npm run seed`.
- Bus tracking is simulated (`server/routes/bus.js`) until you connect a real GPS feed.

## Production
`npm run build` then `npm start` – Express serves `client/dist`.
