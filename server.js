const express = require('express');
const venom = require('venom-bot');

const app = express();
app.use(express.json());

let venomClient;

// Start Venom Bot
venom
  .create({
    session: 'sessionname',
    headless: true,
    logQR: false,
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  .then((client) => {
    venomClient = client;
    console.log('Venom Bot started');
  })
  .catch((err) => {
    console.log('Error starting Venom Bot:', err);
  });

// Route to Generate QR Code
app.get('/generate-qr', (req, res) => {
  if (!venomClient) {
    return res.status(500).json({ message: 'Bot is not ready' });
  }

  venomClient.onStateChange((state) => {
    console.log('Connection state:', state);
  });

  venomClient.onQrCode((qr) => {
    res.json({ qrCode: qr });
  });
});

// Route to Send Text Message
app.post('/send-message', (req, res) => {
  const { number, message } = req.body;

  if (!venomClient) {
    return res.status(500).json({ message: 'Bot is not ready' });
  }

  venomClient
    .sendText(`${number}@c.us`, message)
    .then((result) => {
      res.json({ result });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

// Route to Send Media (Audio, Video, etc.)
app.post('/send-media', (req, res) => {
  const { number, filePath, fileType, caption } = req.body;

  if (!venomClient) {
    return res.status(500).json({ message: 'Bot is not ready' });
  }

  venomClient
    .sendFile(`${number}@c.us`, filePath, fileType, caption)
    .then((result) => {
      res.json({ result });
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
