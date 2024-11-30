require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();

// Environment variables
const clientID = process.env.CAL_CLIENT_ID;
const clientSecret = process.env.CAL_CLIENT_SECRET;
const redirectURI = 'http://localhost:3001/callback'; // Ensure this matches your registered URI
const scope = 'READ_BOOKING WRITE_BOOKING'; // Adjust as needed

// Middleware to parse JSON payloads
app.use(express.json()); // Correct middleware for JSON payloads

// Error handling for uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('There was an uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Function to generate a random state string
function generateRandomState() {
  return crypto.randomBytes(16).toString('hex');
}

console.log("clientid: ",clientID, "secret: ", clientSecret, "redirectURI: ", redirectURI, "scope: ",scope);

// Route to handle Cal webhooks
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

// Route to initiate OAuth installation process
app.get('/install', (req, res) => {
  const state = generateRandomState();
  console.log("Installing.....");
  const authUrl = `https://app.cal.com/auth/oauth2/authorize?client_id=${clientID}&state=asdfjasasdfasdfsd&redirect_uri=${redirectURI}&scope=${scope}`;
  res.redirect(authUrl);
  console.log("auth url: ", authUrl)
  console.log("Reached after the first redirect");
});

// Callback route to handle authorization code and exchange it for an access token
app.get('/callback', async (req, res) => {
  console.log("at callback")
  const { code } = req.query;
  console.log("Callback received");
  try {
    console.log("This is the code: ", code);
    const tokenResponse = await exchangeForTokens(code);
    console.log('Access Token:', tokenResponse.access_token);
    res.send('Authentication successful! You can now use the Cal.com API.');
  } catch (error) {
    console.error('Error during OAuth flow:', error.response ? error.response.data : error.message);
    res.status(500).send('Authentication failed');
  }
});

// Function to exchange authorization code for access token
async function exchangeForTokens(code) {
  try {
    console.log("This is the code from the exchange token function, ", code);
    const response = await axios.post('https://app.cal.com/api/auth/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: clientID,
        client_secret: clientSecret,
        redirect_uri: redirectURI,
        code: code,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log("This is the response data from the exchange token function: ", response.data);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to exchange tokens: ${error.response ? error.response.data : error.message}`);
  }
}

// Start the Express server on port 3001
app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log('To retrieve token, visit http://localhost:3001/install');
});