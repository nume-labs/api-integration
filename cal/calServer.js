process.on('uncaughtException', (err) => {
    console.error('There was an uncaught exception:', err);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

const express = require('express');
const app = express();

// Middleware to parse JSON payloads
app.use(express.json()); // Correct middleware for JSON payloads

// Main route to handle Cal webhooks
app.post('/cal', async (req, res) => {
  try {
    // Log the incoming request body
    console.log('Webhook received:', req.body);

    // Extract the payload from the webhook request
    const { triggerEvent, payload } = req.body;

    // Log the event type for debugging
    console.log(`Received event: ${triggerEvent}`);

    // Check if the event is a booking creation
    if (triggerEvent === 'BOOKING_CREATED') {
      // Extract the unique identifier (e.g., 'uid') from the payload
      const uniqueIdentifier = payload?.uid; // Use optional chaining to avoid errors if `payload` is undefined

      // Log the UID for debugging
      console.log(`Unique Identifier (UID): ${uniqueIdentifier}`);

      // Example: Pass the UID to Twilio or another service
      console.log(`Passing UID ${uniqueIdentifier} to Twilio...`);

      // Respond with a success message
      return res.status(200).json({ message: 'Webhook received and processed successfully.' });
    }

    // Handle other event types if necessary
    console.log('Unhandled event type:', triggerEvent);
    return res.status(200).json({ message: 'Event received but not processed.' });
  } catch (error) {
    // Log errors for debugging
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(3001, () => {
  console.log('Express server listening on port 3001');
});

