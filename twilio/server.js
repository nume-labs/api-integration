require('dotenv').config();
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const deleteBooking = require('../cal/deleteBooking');
// const scheduleMsg = require('./msgScheduler');
const createNote = require('../hubspot/createNote');
const { getUserIdByPhone, getUserByPhone } = require('../hubspot/findUserByPhone');
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
const fs = require('fs').promises;
const path = require('path');
const {updateLeadStatus} = require('../hubspot/updateLead')
const {checkAndScheduleNextReminder} = require('../cal/msgScheduler')


const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));

// OAuth 2.0 configuration
const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'crm.objects.contacts.read crm.objects.contacts.write';

const TOKEN_FILE_PATH = path.join(__dirname, 'hubspot_tokens.json');

//function to save tokens to file.
async function saveTokensToFile(tokens) {
  tokens.expires_at = Date.now() + tokens.expires_in * 1000;
  await fs.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokens, null, 2));
}

//function to read tokens from file returns json parsed data of the tokens.
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


//function to refresh tokens. returns the new tokens
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

// OAuth 2.0 install route. this is where the flow originates from the first time server starts
app.get('/install', (req, res) => {
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}`;
  res.redirect(authUrl);
});

// OAuth 2.0 callback route. this is where the refresh token comes to the url after install route
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


// OAuth 2.0 exchangetoken function. used in callback route. 
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
    //error handling for unfetched tokens
    if (!tokens) {
      throw new Error('No valid token. Please re-authenticate.');
    }

    //check if tokens have expired
    if (isTokenExpired(tokens)) {
      //refresh tokens if they have expired
      tokens = await refreshTokens(tokens);
    }

    //initialize hubspot client, by passing the fetched access token
    const hubspotClient = new hubspot.Client({ accessToken: tokens.access_token });
    
    // const response = await getUserIdByPhone(phoneNumber, hubspotClient);
    // const userID = response.results?.[0]?.id;
    
    //example userID, to be removed in production.
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

//make calls to the message scheduler in the cal file. 
async function handleScheduleMessage(message, phoneNumber){
  //if the lead status is confirmed, change the message 


  //if the lead status is not confirmed, schedule a message which requires confirmation 

}


function isTokenExpired(tokens) {
  return tokens.expires_at && Date.now() > tokens.expires_at;
}

// Handler functions for incoming message types
async function handleCancel(twiml, phoneNumber) {

  //APPOINTMENT CANCELLED LEAD STATUS TO BE SET (not to be confused with lifecycle stage)
  //code here

  //SEARCH FOR SCHEDULED MESSAGES, CANCEL THOSE
  //code here 

  //Delete booking using cal API
  await deleteBooking(phoneNumber);

  //create a note for a cancelled appointment. 
  await handleNoteCreation("Contact cancelled appointment", phoneNumber);

  //update lead status on hubspot
  //code here


  twiml.message("Thank you, we will send you a cancel confirmation soon.");
}

async function handleReschedule(twiml, phoneNumber) {


  //CANCEL CAL BOOKING 
  //code here 


  //CANCEL SCHEDULED MESSAGES IF ANY
  //code here


  twiml.message("Thank you, we will send you a reschedule confirmation soon.");
}



//TODO --> LOG AS AN SMS IN HUBSPOT
async function handleYes(twiml, phoneNumber) {
  try {
    console.log("Starting handleYes function");
    //step1 = create note for booking confirmation
    console.log("Creating first note");
    await handleNoteCreation("Contact confirmed appointment", phoneNumber);
    //TODO --> handle with success message instead of logging to the console 
    console.log("First note created successfully");

    //Step 2 = update lead status
    console.log("Updating lead status");
    await updateLeadStatus(71196564006, "OPEN_DEAL");
    //TODO --> handle with success message instead of logging to the console 
    console.log("Lead status updated successfully");

    //Step 3 = create a second note for the updation of lead status
    console.log("Creating second note");
    await handleNoteCreation("Contact Lead status updated", phoneNumber);
    //TODO --> handle with success message instead of logging to the console 
    console.log("Second note created successfully");

    //Step 4 = schedule the next message
    await handleScheduleMessage(phoneNumber); 
    console.log("Scheduling next message");

    //Step 5 = create note for the newly scheduled message 
    await handleNoteCreation("New appointment reminder scheduled.", phoneNumber)

    console.log("Sending response message");
    twiml.message("Thank you for confirming your appointment.");
    console.log("Response message sent");

  } catch (error) {
    console.error("Error in handleYes function:", error);
    twiml.message("An error occurred while processing your request. Please try again later.");
  }
}

// Main route to handle incoming SMS
app.post('/sms', async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body.trim().toLowerCase();
  const fromNumber = req.body.From;

  console.log(`Received message from ${fromNumber}: ${incomingMessage}`);

  switch (incomingMessage) {
    case "hello":
      //TODO --> CREATE NOTE FOR WHEN A MESSAGE IS SCHEDULED
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

//TODO --> AWS AMPLIFY HOSTING OR ON NETLIFY. OR SUPABASE
app.listen(3000, () => {
  console.log('Express server listening on port 3000');
  console.log('To start OAuth flow, visit: http://localhost:3000/install');
});