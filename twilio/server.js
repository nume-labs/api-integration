require('dotenv').config();
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const deleteBooking = require('../cal/deleteBooking');
const scheduleMsg = require('../twilio/scheduleMsg24');
const createNote = require('../hubspot/createNote');
const { getUserIdByPhone, getUserByPhone } = require('../hubspot/findUserByPhone');
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));

// OAuth 2.0 configuration
const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'crm.objects.contacts.read crm.objects.contacts.write';

const TOKEN_FILE_PATH = path.join(__dirname, 'hubspot_tokens.json');

async function saveTokensToFile(tokens) {
  tokens.expires_at = Date.now() + tokens.expires_in * 1000;
  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2));
}

async function readTokensFromFile() {
  try {
    const data = await fs.readFile(TOKEN_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No token file found. Need to authenticate.');
      return null;
    }
    throw error;
  }
}

async function refreshTokens(tokens) {
  try {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
      },
    });
    const newTokens = response.data;
    await saveTokensToFile(newTokens);
    return newTokens;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

// OAuth 2.0 routes
app.get('/install', (req, res) => {
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await exchangeForTokens(code);
    await saveTokensToFile(tokenResponse);
    res.send('Authentication successful! You can now use the HubSpot API.');
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

// Helper to find user ID and create a note
async function handleNoteCreation(message, phoneNumber) {
  try {
    let tokens = await readTokensFromFile();
    if (!tokens) {
      throw new Error('No valid token. Please re-authenticate.');
    }

    if (isTokenExpired(tokens)) {
      tokens = await refreshTokens(tokens);
    }

    const hubspotClient = new hubspot.Client({ accessToken: tokens.access_token });
    
    // const response = await getUserIdByPhone(phoneNumber, hubspotClient);
    // const userID = response.results?.[0]?.id;
    userID = 71196564006;
    if (userID) {
      await createNote(message, userID, hubspotClient);
      console.log(`Note created for userID: ${userID}`);
    } else {
      console.warn(`No user found for phone number: ${phoneNumber}`);
    }
  } catch (error) {
    console.error("Error finding user or creating note:", error);
    if (error.response && error.response.status === 401) {
      await fs.unlink(TOKEN_FILE_PATH).catch(() => {}); // Delete the token file
      console.error("Authentication failed. Please re-authenticate.");
    }
  }
}

function isTokenExpired(tokens) {
  return tokens.expires_at && Date.now() > tokens.expires_at;
}

// Handler functions for incoming message types
async function handleCancel(twiml, phoneNumber) {
  await deleteBooking(phoneNumber);
  await handleNoteCreation("Contact cancelled appointment", phoneNumber);
  twiml.message("Thank you, we will send you a cancel confirmation soon.");
}

async function handleReschedule(twiml) {
  twiml.message("Thank you, we will send you a reschedule confirmation soon.");
}

async function handleYes(twiml, phoneNumber) {
  await scheduleMsg(phoneNumber);
  await handleNoteCreation("Contact confirmed appointment", phoneNumber);
  twiml.message("Thank you for confirming your appointment.");
}

// Main route to handle incoming SMS
app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body.trim().toLowerCase();
  const fromNumber = req.body.From;

  console.log(`Received message from ${fromNumber}: ${incomingMessage}`);

  switch (incomingMessage) {
    case "hello":
      await handleNoteCreation(incomingMessage, fromNumber);
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

  res.type('text/xml').send(twiml.toString());
});

// Start the server
app.listen(3000, () => {
  console.log('Express server listening on port 3000');
  console.log('To start OAuth flow, visit: http://localhost:3000/install');
});