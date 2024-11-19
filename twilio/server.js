const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const deleteBooking = require('../cal/deleteBooking');
const scheduleMsg = require('../twilio/scheduleMsg24');
const createNote = require('../hubspot/createNote');
const {getUserIdByPhone, getUserByPhone} = require('../hubspot/findUserByPhone');
const axios = require('axios');
const app = express();

// Middleware to parse incoming Twilio messages
app.use(express.urlencoded({ extended: true }));

// OAuth 2.0 configuration
const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'crm.objects.contacts.read crm.objects.contacts.write';



let accessToken = null;
let refreshToken = null;

// OAuth 2.0 routes
app.get('/install', (req, res) => {
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await exchangeForTokens(code);
    accessToken = tokenResponse.access_token;
    refreshToken = tokenResponse.refresh_token;
    res.send('Authentication successful! You can now use the HubSpot API.');
    console.log("access token: ", accessToken);
    console.log("refresh token: ", refreshToken)
  } catch (error) {
    console.error('Error during OAuth flow:', error);
    res.status(500).send('Authentication failed');
  }
});

async function exchangeForTokens(code) {
  const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
    params: {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: code,
    },
  });
  return response.data;
}

async function refreshAccessToken() {
  try {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
      },
    });
    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

// Helper to find user ID and create a note
async function handleNoteCreation(message, phoneNumber) {
    try {
        let token = await getToken();
        
        if (!token || new Date(token.expires_at) <= new Date()) {
            if (token && token.refresh_token) {
                token = await refreshToken(token.refresh_token);
                token.expires_at = new Date(Date.now() + token.expires_in * 1000).toISOString();
                await saveToken(token);
            } else {
                throw new Error('No valid token. Please re-authenticate.');
            }
        }

        const hubspotClient = new hubspot.Client({ accessToken: token.access_token });
        
        const response = await getUserIdByPhone(phoneNumber, hubspotClient);
        const userID = response.results?.[0]?.id;
        if (userID) {
            await createNote(message, userID, hubspotClient);
            console.log(`Note created for userID: ${userID}`);
        } else {
            console.warn(`No user found for phone number: ${phoneNumber}`);
        }
    } catch (error) {
        console.error("Error finding user or creating note:", error);
        if (error.response && error.response.status === 401) {
            // Token might be invalid, clear it and prompt for re-authentication
            await saveToken(null);
            console.error("Authentication failed. Please re-authenticate.");
        }
    }
}

// Handler functions for incoming message types
async function handleCancel(twiml, phoneNumber) {
  await deleteBooking(phoneNumber);
  await handleNoteCreation("Contact cancelled appointment", phoneNumber);
  twiml.message("Thank you, we will send you a cancel confirmation soon."); //edit
}

//send link to GUI
async function handleReschedule(twiml) {
  twiml.message("Thank you, we will send you a reschedule confirmation soon.");
}

//lead status needs to change aswell to appointment confirmed. and at 12 or 1 hour mark if they have already confirmed, they dont need to confirm again. 

//failure to attend will result in inability to rebook a future consultation --> only for the 12 and 1 hour message.
async function handleYes(twiml, phoneNumber) {
  await scheduleMsg(phoneNumber);
  await handleNoteCreation("Contact confirmed appointment", phoneNumber);
  twiml.message("Thank you for confirming your appointment.");
}

// Main route to handle incoming SMS
app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body.trim().toLowerCase(); // Normalize the message text
  const fromNumber = req.body.From;

  console.log(`Received message from ${fromNumber}: ${incomingMessage}`);

  // Log all incoming messages as notes
  // await handleNoteCreation(incomingMessage, fromNumber);

  // Determine response based on message content
  switch (incomingMessage) {
    case "hello":
      handleNoteCreation(incomingMessage, fromNumber)
      twiml.message("Hello! How can I assist you today?");
      break;
    case "cancel":
      await handleCancel(twiml, fromNumber);
      break;
    case "reschedule":
      await handleReschedule(twiml);
      break;
    case "yes":
      await handleYes(twiml, fromNumber);
      break;
    default:
      twiml.message("Please respond with either Cancel | Reschedule | Yes.");
      break;
  }

  // Send the TwiML response
  res.type('text/xml').send(twiml.toString());
});

// Start the server
app.listen(3000, () => {
  console.log('Express server listening on port 3000');
  console.log('To start OAuth flow, visit: http://localhost:3000/install');
});