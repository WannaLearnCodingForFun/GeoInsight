import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

function requireBearer(req, res, next) {
  const h = req.header('authorization') || '';
  if (!h.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const token = h.slice('bearer '.length).trim();
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  req.bearerToken = token;
  next();
}

app.get('/', (_req, res) => {
  res.type('text').send(
    [
      'LANDROID backend is running.',
      'Available endpoints:',
      '- GET /health',
      '- GET /me (requires Authorization: Bearer <token>)',
      '- POST /parcel (requires Authorization: Bearer <token>)',
    ].join('\n')
  );
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Protected API (FR-05)
app.get('/me', requireBearer, (req, res) => {
  res.json({ ok: true, bearerTokenPresent: true });
});

app.post('/parcel', requireBearer, (req, res) => {
  const { name, boundaryGeojson, centroid, bbox, assignedTo } = req.body ?? {};
  res.json({
    ok: true,
    parcel: {
      id: `parcel_${Date.now()}`,
      name,
      boundaryGeojson,
      centroid,
      bbox,
      assignedTo,
      createdAt: new Date().toISOString(),
    },
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(port, () => {
  console.log(`landroid backend listening on http://localhost:${port}`);
});

