const express = require('express');
const venom = require('venom-bot');

const app = express();
app.use(express.json());

let venomClient;
let qrCode; // Variable to store the QR code temporarily
let retries = 0;
const maxRetries = 5; // Max number of retries
const retryDelay = 5000; // Delay in milliseconds (5 seconds)

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to initialize Venom Bot with retry logic
async function startVenomBot() {
    try {
      venomClient = await venom.create({
        session: 'sessionname',
        headless: 'new',
        logQR: false,
        browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
      }).then((client) => {
        venomClient = client;
        console.log('Venom Bot started');

        // Listen for QR code generation
        client.on('qr', (qr) => {
          console.log('Generated QR Code');
          qrCode = qr; // Store the QR code
        });

        // Listen for state changes
        client.onStateChange((state) => {
          console.log('Connection state:', state);
        });
      });
      
    } catch (err) {
        console.error('Error starting Venom Bot:', err);

        // Check if err.message exists and then check for ERR_CONNECTION_REFUSED
        const errorMessage = err && err.message ? err.message : 'Unknown error';
        
        if (errorMessage.includes('ERR_CONNECTION_REFUSED') && retries < maxRetries) {
          retries += 1;
          console.log(`Retrying to start Venom Bot... Attempt ${retries}/${maxRetries}`);
          await delay(retryDelay); // Wait before retrying
          startVenomBot(); // Retry
        } else {
          console.error('Failed to start Venom Bot after several attempts');
        }
      }
    }
  
  // Start the Venom Bot with retry logic
  startVenomBot();
  
  // Route to Generate QR Code
  app.get('/generate-qr', (req, res) => {
    if (!venomClient) {
      return res.status(500).json({ message: 'Bot is not ready' });
    }
  
    if (!qrCode) {
      return res.status(500).json({ message: 'QR Code not generated yet' });
    }
  
    res.json({ qrCode });
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
