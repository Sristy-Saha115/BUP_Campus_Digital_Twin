const router = require('express').Router();

// DEMO FEED: positions are simulated along a straight line between two points.
// Replace getBuses() with data from a real GPS provider/device when you have one.
const ROUTES = [
  { id: 'BUP-BUS-01', route: 'Mirpur-12 → BUP Main Campus', from: [23.8223, 90.3654], to: [23.8378, 90.3582], offset: 0, periodSec: 600 },
  { id: 'BUP-BUS-02', route: 'Mirpur-10 → BUP Main Campus', from: [23.8069, 90.3687], to: [23.8378, 90.3582], offset: 200, periodSec: 720 },
];

function getBuses() {
  const now = Date.now() / 1000;
  return ROUTES.map((b) => {
    const phase = ((now + b.offset) % b.periodSec) / b.periodSec;       // 0..1
    const p = phase < 0.5 ? phase * 2 : (1 - phase) * 2;                // ping-pong
    const headingToCampus = phase < 0.5;
    const remaining = headingToCampus ? 1 - p : p;
    return {
      busId: b.id,
      route: b.route,
      latitude: +(b.from[0] + (b.to[0] - b.from[0]) * p).toFixed(6),
      longitude: +(b.from[1] + (b.to[1] - b.from[1]) * p).toFixed(6),
      etaMinutes: Math.max(1, Math.round(remaining * (b.periodSec / 2) / 60)),
      direction: headingToCampus ? 'toCampus' : 'fromCampus',
      simulated: true,
      updatedAt: new Date().toISOString(),
    };
  });
}

router.get('/', (req, res) => res.json({ buses: getBuses() }));

module.exports = router;
