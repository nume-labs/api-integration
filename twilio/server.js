require('dotenv').config();
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const deleteBooking = require('../cal/deleteBooking');
const scheduleMsg = require('../twilio/scheduleMsg24');
const createNote = require('../hubspot/createNote');
const { getUserIdByPhone, getUserByPhone } = require('../hubspot/findUserByPhone');
const axios = require('axios');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const hubspot = require('@hubspot/api-client');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({
  store: new FileStore({
    path: './sessions',
    ttl: 86400, // 1 day
    retries: 0
  }),
  secret: 'your_secret_key', // Replace with a strong, unique secret
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// OAuth 2.0 configuration
const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'crm.objects.contacts.read crm.objects.contacts.write';

// Token management functions
function saveTokens(req, tokens) {
  tokens.expires_at = Date.now() + tokens.expires_in * 1000;
  req.session.hubspotTokens = tokens;
  console.log(`Tokens saved for session: ${req.sessionID}`, tokens);
}

function getTokens(req) {
  const tokens = req.session.hubspotTokens;
  console.log(`Retrieved tokens for session: ${req.sessionID}`, tokens);
  return tokens;
}

async function refreshTokens(req) {
  const tokens = getTokens(req);
  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh token available');
  }
  
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
    saveTokens(req, newTokens);
    return newTokens;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

// OAuth 2.0 routes
app.get('/install', (req, res) => {
  req.session.oauthState = Date.now();
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!req.session.oauthState) {
    return res.status(400).send('OAuth state mismatch. Please try again.');
  }
  try {
    const tokenResponse = await exchangeForTokens(code);
    console.log(tokenResponse);
    saveTokens(req, tokenResponse);
    console.log("Session ID:", req.sessionID);
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
async function handleNoteCreation(req, message, phoneNumber) {
  try {
    let tokens = getTokens(req);
    console.log(tokens);
    console.log("Session ID:", req.sessionID);
    if (!tokens) {
      throw new Error('No valid token. Please re-authenticate.');
    }

    if (isTokenExpired(tokens)) {
      tokens = await refreshTokens(req);
    }

    const hubspotClient = new hubspot.Client({ accessToken: tokens.access_token });
    
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
      req.session.hubspotTokens = null;
      console.error("Authentication failed. Please re-authenticate.");
    }
  }
}

function isTokenExpired(tokens) {
  return tokens.expires_at && Date.now() > tokens.expires_at;
}

// Handler functions for incoming message types
async function handleCancel(req, twiml, phoneNumber) {
  await deleteBooking(phoneNumber);
  await handleNoteCreation(req, "Contact cancelled appointment", phoneNumber);
  twiml.message("Thank you, we will send you a cancel confirmation soon.");
}

async function handleReschedule(twiml) {
  twiml.message("Thank you, we will send you a reschedule confirmation soon.");
}

async function handleYes(req, twiml, phoneNumber) {
  await scheduleMsg(phoneNumber);
  await handleNoteCreation(req, "Contact confirmed appointment", phoneNumber);
  twiml.message("Thank you for confirming your appointment.");
}

// Main route to handle incoming SMS
app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body.trim().toLowerCase();
  const fromNumber = req.body.From;

  console.log(`Received message from ${fromNumber}: ${incomingMessage}`);
  console.log("Session ID:", req.sessionID);

  switch (incomingMessage) {
    case "hello":
      await handleNoteCreation(req, incomingMessage, fromNumber);
      twiml.message("Hello! How can I assist you today?");
      break;
    case "cancel":
      await handleCancel(req, twiml, fromNumber);
      break;
    case "reschedule":
      await handleReschedule(twiml);
      break;
    case "yes":
      await handleYes(req, twiml, fromNumber);
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