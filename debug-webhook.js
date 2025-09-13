// Quick test to see if webhook endpoint receives anything
const express = require('express');
const app = express();

app.use(express.json());

app.post('/test-webhook', (req, res) => {
  console.log('🔥 WEBHOOK RECEIVED!');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({ received: true });
});

app.listen(3001, () => {
  console.log('Test webhook server running on http://localhost:3001/test-webhook');
});
