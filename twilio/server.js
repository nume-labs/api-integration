require('dotenv').config();
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const {deleteBooking} = require('../cal/deleteBooking');
// const scheduleMsg = require('./msgScheduler');
const createNote = require('../hubspot/createNote');
const { getUserIdByPhone } = require('../hubspot/findUserByPhone');
const axios = require('axios');
const hubspot = require('@hubspot/api-client');
const fs = require('fs').promises;
const path = require('path');
const {updateLeadStatus} = require('../hubspot/updateLead')
const {checkAndScheduleNextReminderContactId, listScheduledMessages, handleCancelMessage} = require('../cal/msgScheduler')
const {getLatestScheduledMeeting} = require ('../hubspot/getMeetingByOutcome')
const {getBookingIdByUid} = require('../cal/getIdByUid');


const app = express();

//TODO --> ALL NOTE CREATIONS SHOULD BE AFTER THE ACTION

// Middleware
app.use(express.urlencoded({ extended: true }));

// OAuth 2.0 configuration
const CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPE = 'crm.objects.contacts.read crm.objects.contacts.write settings.users.write settings.users.read';

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
  console.log("redirecting to..: ", authUrl)
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
// TODO --> method signature should have phoneNumber added to it. 
async function handleNoteCreation(message, phoneNumber) {
  try {
      // Step 1: Read tokens from file
      console.log("Reading tokens from file...");
      let tokens = await readTokensFromFile();

      // Handle case where tokens are not available
      if (!tokens) {
          return {
              statusCode: 401,
              message: 'No valid token. Please re-authenticate.',
              data: null,
          };
      }

      // Step 2: Check if tokens have expired
      if (isTokenExpired(tokens)) {
          console.log("Tokens expired. Refreshing tokens...");
          tokens = await refreshTokens(tokens);
      }

      // Step 3: Initialize HubSpot client with the access token
      console.log("Initializing HubSpot client...");
      const hubspotClient = new hubspot.Client({ accessToken: tokens.access_token });

      // Step 4: Fetch user ID by phone number (or use example user ID for testing)
      console.log(`Fetching user ID for phone number: ${phoneNumber}`);
      const userIdResponse = await getUserIdByPhone(phoneNumber, hubspotClient);

      if (userIdResponse.statusCode !== 200 || !userIdResponse.data.userId) {
          console.warn(`No user found for phone number: ${phoneNumber}`);
          return {
              statusCode: 404,
              message: `No user found for phone number: ${phoneNumber}`,
              data: null,
          };
      }

      const userID = userIdResponse.data.userId;

      // Step 5: Create note for the user
      console.log(`Creating note for user ID: ${userID}`);
      const noteResponse = await createNote(message, userID, hubspotClient);

      if (noteResponse.statusCode !== 200) {
          console.error(`Failed to create note: ${noteResponse.message}`);
          return noteResponse;
      }

      console.log("Note created successfully");
      return {
          statusCode: 200,
          message: 'Note created successfully',
          data: noteResponse.data,
      };
  } catch (error) {
      console.error("Error in handleNoteCreation:", error.message);

      if (error.response && error.response.status === 401) {
          console.error("Authentication failed. Deleting token file and prompting re-authentication...");
          await fs.unlink(TOKEN_FILE_PATH).catch(() => {}); // Delete the token file
          return {
              statusCode: 401,
              message: 'Authentication failed. Please re-authenticate.',
              data: null,
          };
      }

      return {
          statusCode: 500,
          message: error.message || 'An unknown error occurred',
          data: null,
      };
  }
}

function isTokenExpired(tokens) {
  return tokens.expires_at && Date.now() > tokens.expires_at;
}

//TODO --> handle cancel
// this function cancels the appointment, then the rest of the workflow is handled via the calServer --> handleCancel function. 
async function handleCancel(twiml, phoneNumber) {

  console.log(`Fetching user ID for phone number: ${phoneNumber}`);
  const userIdResponse = await getUserIdByPhone(phoneNumber);
  if (userIdResponse.statusCode !== 200 || !userIdResponse.data.userId) {
      console.warn(`No user found for phone number: ${phoneNumber}`);
      return {
          statusCode: 404,
          message: `No user found for phone number: ${phoneNumber}`,
          data: null,
      };
  }
  const userID = userIdResponse.data.userId;


  //Steps to do
  //get the latest scheduled meeting
  let bookingUID
  const meetingResponse = await getLatestScheduledMeeting(userID);
  if(meetingResponse.statusCode === 200){
    bookingUID = meetingResponse.bookingUID;
  }else{
    console.error("error when getting previous meeting ID: ", meetingResponse.message);
  }
  //get bookingID from UID
  const getIdFromCalResponse = await getBookingIdByUid(bookingUID);
  let bookingID
  if(getIdFromCalResponse.statusCode === 200){
    bookingID = getIdFromCalResponse.data.data.id;
  }else{
    console.log("could not get ID from UID: ", getIdFromCalResponse.message);
  }

  //cancel booking on cal using this id
  const cancelCalResponse = await deleteBooking(bookingID); 
  if(cancelCalResponse.statusCode === 200){
    console.log("booking cancelled successfully");
    //make a note flagging this cancelled booking 
    const cancelNoteResponse = await handleNoteCreation(`meeting has been cancelled of booking ID: ${bookingID} and UID: ${bookingUID}`); 
    if(cancelNoteResponse.statusCode != 200){
      console.error("Could not create note for the canceled booking"); 
    }
    console.log("Note for canceled booking created successfully");
  }else{
    console.error("Could not cancel booking: ", cancelCalResponse.message);
  }

  twiml.message("your meeting has been canceled, we hope to hear from you soon.");
}

//TODO --> HOW TO SEND GUI LINK OF RESCHEDULE
async function handleReschedule(twiml, phoneNumber) {
  console.log("starting the handleReschedule function...")

  console.log(`Fetching user ID for phone number: ${phoneNumber}`);
  const userIdResponse = await getUserIdByPhone(phoneNumber);

  if (userIdResponse.statusCode !== 200 || !userIdResponse.data.userId) {
      console.warn(`No user found for phone number: ${phoneNumber}`);
      return {
          statusCode: 404,
          message: `No user found for phone number: ${phoneNumber}`,
          data: null,
      };
  }
  const userID = userIdResponse.data.userId;
  // Create a note saying this person wants to reschedule the appointment. 
  console.log("Creating first note");
  const noteResponse1 = await handleNoteCreation("Contact wants to reschedule appointment", phoneNumber);
        if (noteResponse1.statusCode !== 200) {
          console.error(`Failed to create first note: ${noteResponse1.message}`);
          twiml.message("An error occurred while confirming your appointment. Please try again later.");
          return;
      }
      console.log("note created successfully");

    
  twiml.message("To reschedule your appointment, please open the confirmation email you received and click the 'Reschedule' button at the bottom.");
}



//TODO --> LOG AS AN SMS IN HUBSPOT
async function handleYes(twiml, phoneNumber) {
  try {

      console.log("Starting handleYes function");
      console.log(`Fetching user ID for phone number: ${phoneNumber}`);
      const userIdResponse = await getUserIdByPhone(phoneNumber);

      if (userIdResponse.statusCode !== 200 || !userIdResponse.data.userId) {
          console.warn(`No user found for phone number: ${phoneNumber}`);
          return {
              statusCode: 404,
              message: `No user found for phone number: ${phoneNumber}`,
              data: null,
          };
      }

      const userID = userIdResponse.data.userId;

      // Step 1: Create a note for booking confirmation
      console.log("Creating first note");
      const noteResponse1 = await handleNoteCreation("Contact confirmed appointment", phoneNumber);

      if (noteResponse1.statusCode !== 200) {
          console.error(`Failed to create first note: ${noteResponse1.message}`);
          twiml.message("An error occurred while confirming your appointment. Please try again later.");
          return;
      }
      console.log("First note created successfully");

      // Step 2: Update lead status
      //TODO --> ASK TASKIN WHAT THE LEAD STATUS SHOULD BE EXACTLY.
      console.log("Updating lead status");
      const leadStatusResponse = await updateLeadStatus(userID, "OPEN_DEAL");

      if (leadStatusResponse.statusCode !== 200) {
          console.error(`Failed to update lead status: ${leadStatusResponse.message}`);
          twiml.message("An error occurred while updating your appointment status. Please try again later.");
          return;
      }
      console.log("Lead status updated successfully");

      // Step 3: Create a second note for the lead status update
      console.log("Creating second note");
      const noteResponse2 = await handleNoteCreation("Contact Lead status updated", phoneNumber);

      if (noteResponse2.statusCode !== 200) {
          console.error(`Failed to create second note: ${noteResponse2.message}`);
          twiml.message("An error occurred while processing your request. Please try again later.");
          return;
      }
      console.log("Second note created successfully");

      // Step 4: Schedule the next message
      console.log("Scheduling next message");

      console.log("getting meetingID")
      //TODO --> get the meetingID
      //get the latest scheduled meeting. 
      const meetingResponse = await getLatestScheduledMeeting(userID)
      if(meetingResponse.statusCode === 200){
        console.log("got latest meeting: ", meetingResponse.data);
      }else{
        console.error("Error has occured getting the meeting from hubspot: ", meetingResponse.message);
      }

      const bookingUID = meetingResponse.bookingUID;

      console.log("got booking uid: ", bookingUID);

      console.log("scheduling next reminder")
      //needs to be from the bookingUID
      const scheduleResponse = await checkAndScheduleNextReminderContactId(bookingUID, userID);

      if (scheduleResponse.statusCode !== 200) {
          console.error(`Failed to schedule next message: ${scheduleResponse.message}`);
          twiml.message("An error occurred while scheduling your next reminder. Please try again later.");
          return;
      }
      console.log("Next message scheduled successfully");

      // Step 5: Create a note for the newly scheduled message
      console.log("Creating third note");
      const noteResponse3 = await handleNoteCreation("New appointment reminder scheduled.", phoneNumber);

      if (noteResponse3.statusCode !== 200) {
          console.error(`Failed to create third note: ${noteResponse3.message}`);
          twiml.message("An error occurred while processing your request. Please try again later.");
          return;
      }
      console.log("Third note created successfully");

      // Send confirmation response
      console.log("Sending response message");
      twiml.message("Thank you for confirming your appointment.");
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

module.exports = {
  handleNoteCreation
}