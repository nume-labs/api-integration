require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const {getUserIdByEmail} = require('../hubspot/getContactByEmail')
const {createHubSpotMeeting} = require('../hubspot/createMeeting')
const {checkAndScheduleNextReminderContactId} = require('../cal/msgScheduler')
const {handleNoteCreation} = require('../twilio/server')
const {getPhoneNumberByContactId} = require('../hubspot/getPhoneNumber')
const {handleCancelMessage} = require('../cal/msgScheduler')
const {getMeetingsByBookingContactOutcome} = require("../hubspot/getMeeting");
const { updateMeetingOutcome } = require('../hubspot/updateMeetingOutcome');
const {updateLeadStatus} = require('../hubspot/updateLead')

const app = express();

//TODO --> ALL NOTE CREATIONS SHOULD BE AFTER THE ACTION

// Environment variables
const clientID = process.env.CAL_CLIENT_ID;
const clientSecret = process.env.CAL_CLIENT_SECRET;

// Middleware to parse JSON payloads
app.use(express.json());

// Error handling for uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('There was an uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Route to handle Cal webhooks
app.post('/cal', async (req, res) => {
  try {
    // Log the incoming request body
    // console.log('Webhook received:', req.body);

    // Extract the payload from the webhook request
    const { triggerEvent, payload } = req.body;

    // Log the event type for debugging
    console.log(`Received event: ${triggerEvent}`);

    // Handle different trigger events
    switch (triggerEvent) {
      case 'BOOKING_CREATED':
        handleBookingCreated(payload);
        break;
      case 'BOOKING_RESCHEDULED':
        handleBookingRescheduled(payload);
        break;
      case 'BOOKING_CANCELLED': 
        handleBookingCanceled(payload);
      case 'PING':
        console.log("ping recieved: ", payload); 
        break;
      default:
        console.log('Unhandled event type:', triggerEvent);
        return res.status(200).json({ message: 'Event received but not processed.' });
    }

    // Respond with a success message
    return res.status(200).json({ message: 'Webhook received and processed successfully.' });
  } catch (error) {
    // Log errors for debugging
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to handle BOOKING_CREATED event
//TODO --> CREATE NEW USER IN HUBSPOT IF NOT ALREADY PRESENT
async function handleBookingCreated(payload) {
  const bookingUID = payload?.uid;
  const emailID = payload?.attendees[0].email;
  console.log("booking UID: ", bookingUID); 
  console.log("Email ID: ", emailID);

  const getContactResult = await getUserIdByEmail(emailID);
  let contactId;
  if (getContactResult.statusCode === 200) {
    contactId = getContactResult.data.userId;
    console.log("contact id: " , contactId);
  }else{
    //TODO --> Create new user here
    console.error(`Error (${getContactResult.statusCode}): ${getContactResult.message}`);
  }


  const startTime = payload?.startTime;
  const endTime = payload?.endTime;
  const externalUrl = payload?.videoCallData?.url || '';
  const ownerId = process.env.HUBSPOT_OWNER_ID;
  const body = "Booking scheduled, BookingUID can be found in the internal notes"
  console.log("All properties used in this function: ", startTime, endTime, externalUrl, ownerId, body, contactId, bookingUID, emailID)

  //create meeting note in hubspot 
  const meetingNoteResult = await createHubSpotMeeting({startTime, endTime, externalUrl, body, ownerId, bookingUID, contactId });
  if (meetingNoteResult.statusCode === 200) {
    console.log('Meeting note created successfully in HubSpot.');
  } else {
    console.error(`Error (${meetingNoteResult.statusCode}): ${meetingNoteResult.message}`);
  }
  //Trigger message scheduler 
  const messageSchedulerResult = await checkAndScheduleNextReminderContactId(bookingUID, contactId)
  if (messageSchedulerResult.statusCode === 200) {
    console.log('Message scheduler triggered successfully.');

    //get phoneNumber for id. 
    const phoneResult = await getPhoneNumberByContactId(contactId);
    if(phoneResult.statusCode === 200){
      const noteResult = await handleNoteCreation("Reminder Scheduled", phoneResult.data.phone)
      if(noteResult.statusCode === 200){
        console.log("note created for scheduled reminder"); 
      }else{
        console.error("Error creating note: ", noteResult.message);
      }
    }else{
      console.error("Error finding phone: ", phoneResult.message);
    }

  }else{
    console.warn("error: ", messageSchedulerResult.message)
  }

  
  //update lead status
  console.log("Updating lead status");
  const leadStatusResponse = await updateLeadStatus(contactId, "APPOINTMENT_SCHEDULED");

  if (leadStatusResponse.statusCode !== 200) {
      console.error(`Failed to update lead status: ${leadStatusResponse.message}`);
      twiml.message("An error occurred while updating your appointment status. Please try again later.");
      return;
  }
  console.log("Lead status updated successfully");

  console.log("workflow complete")


}

// Function to handle BOOKING_RESCHEDULED event
async function handleBookingRescheduled(payload) {
  const bookingUID = payload?.uid;
  const emailID = payload?.attendees[0].email;
  const rescheduleReason = payload?.responses?.rescheduleReason?.value;
  const fromReschedule = payload?.rescheduleUid;

  //can also get 
  //rescheduleId || bookingId
  //TODO --> ERROR HANDLING? 
  console.log("Booking UID: ", bookingUID);
  console.log("Email ID: ", emailID);
  console.log("Reschedule Reason: ", rescheduleReason);
  console.log("From Reschedule: ", fromReschedule);
  if(fromReschedule === undefined){
    console.log(payload)
  }

  const getContactResult = await getUserIdByEmail(emailID);
  let contactId;
  if (getContactResult.statusCode === 200) {
    contactId = getContactResult.data.userId;
    console.log("Contact ID: ", contactId);
  } else {
    console.error(`Error (${getContactResult.statusCode}): ${getContactResult.message}`);
    return; // Exit if unable to retrieve contact ID
  }

  //TODO --> WHAT LEAD STATUS SHOULD BE THERE FOR RESCHEDULED?

    // //update lead status
    // console.log("Updating lead status");
    // const leadStatusResponse = await updateLeadStatus(contactId, "APPOINTMENT_RESCHEDULED");
  
    // if (leadStatusResponse.statusCode !== 200) {
    //     console.error(`Failed to update lead status: ${leadStatusResponse.message}`);
    //     twiml.message("An error occurred while updating your appointment status. Please try again later.");
    //     return;
    // }
    // console.log("Lead status updated successfully");

  const startTime = payload?.startTime;
  const endTime = payload?.endTime;
  const externalUrl = payload?.videoCallData?.url || '';
  const ownerId = process.env.HUBSPOT_OWNER_ID;
  const body = `Booking rescheduled. Reason: ${rescheduleReason}. BookingUID can be found in the internal notes.`;
  
  console.log("All properties used in this function: ", startTime, endTime, externalUrl, ownerId, body, contactId, bookingUID, emailID);

  // Update meeting note in HubSpot
  const meetingNoteResult = await createHubSpotMeeting({
    startTime,
    endTime,
    externalUrl,
    body,
    ownerId,
    bookingUID,
    contactId
  });

  if (meetingNoteResult.statusCode === 200) {
    console.log('Meeting note updated successfully in HubSpot.');
  } else {
    console.error(`Error (${meetingNoteResult.statusCode}): ${meetingNoteResult.message}`);
    return; // Exit if unable to update meeting note
  }


  //previousMeetingID is the object ID for the previously created meeting in hubspot
  let previousMeetingID; 
  const getMeetingResponse = await getMeetingsByBookingContactOutcome(contactId, fromReschedule, "SCHEDULED")

  if(getMeetingResponse.statusCode === 200){
    console.log("Got previous meeting");
    //extract the previous meeting id; 
    previousMeetingID = getMeetingResponse.data[0].id;
  }else{
    console.error("Could not find previous booked meeting: ", getMeetingResponse.message);
  }
  
  //change the outcome
  const outcomeResponse = await updateMeetingOutcome(previousMeetingID, "RESCHEDULED")
  if(outcomeResponse.statusCode === 200){
    console.log("outcome of previous meeting changed successfully: ", outcomeResponse.data)
  }else{
    console.error("Could not change outcome of previous meeting: ", outcomeResponse.message)
  }

  const phoneResult = await getPhoneNumberByContactId(contactId);
  if (phoneResult.statusCode != 200){
    console.error("Could not find associated phone number: ", phoneResult.message);
  }
  const phoneNumber = phoneResult.data.phone
  //cancel previously scheduled messages. 
  const cancelScheduledMessageResult = await handleCancelMessage(phoneNumber);
  if(cancelScheduledMessageResult.statusCode === 200){
    console.log("Scheduled message cancelled successfully: ", cancelScheduledMessageResult.data);
  }else{
    console.error("Failed to cancel scheduled message: ", cancelScheduledMessageResult.message);
  }

  // Trigger message scheduler
  const messageSchedulerResult = await checkAndScheduleNextReminderContactId(bookingUID, contactId);
  
  if (messageSchedulerResult.statusCode === 200) {
    console.log('Message scheduler triggered successfully.');

    // Get phone number for contact ID
    // const phoneResult = await getPhoneNumberByContactId(contactId);
    if (phoneResult.statusCode === 200) {
      const noteResult = await handleNoteCreation("Reminder Rescheduled", phoneNumber);
      if (noteResult.statusCode === 200) {
        console.log("Note created for rescheduled reminder.");
      } else {
        console.error("Error creating note: ", noteResult.message);
      }
    } else {
      console.error("Error finding phone: ", phoneResult.message);
    }
    
  } else {
    console.warn("Error: ", messageSchedulerResult.message);
  }
}

// Function to handle BOOKING_CANCELED event
async function handleBookingCanceled(payload) {
  const bookingUID = payload?.uid;
  const emailID = payload?.attendees[0].email;
  const fromReschedule = payload?.uid

  console.log("Booking UID: ", bookingUID);
  console.log("Email ID: ", emailID);

  const getContactResult = await getUserIdByEmail(emailID);
  let contactId;
  if (getContactResult.statusCode === 200) {
    contactId = getContactResult.data.userId;
    console.log("Contact ID: ", contactId);
  } else {
    console.error(`Error (${getContactResult.statusCode}): ${getContactResult.message}`);
    return; // Exit if unable to retrieve contact ID
  }




  const ownerId = process.env.HUBSPOT_OWNER_ID;
  const body = "Booking has been canceled. No further actions are required.";
  
  console.log("All properties used in this function: ", ownerId, body, contactId, bookingUID, emailID);

  let previousMeetingID; 
  const getScheduledResponse = await getMeetingsByBookingContactOutcome(contactId, fromReschedule, "SCHEDULED")
  const getReScheduledResponse = await getMeetingsByBookingContactOutcome(contactId, fromReschedule, "RESCHEDULED")

  if(getScheduledResponse.statusCode != 200 && getReScheduledResponse != 200){
    console.error("Could not find previous meeting in either scheduled or rescheduled state: ", getScheduledResponse.message, getReScheduledResponse.message)
  }

  if(getScheduledResponse.statusCode === 200){
    console.log("Got previous meeting from Scheduled State");
    //extract the previous meeting id; 
    previousMeetingID = getScheduledResponse.data[0].id;
  }

  if(getReScheduledResponse.statusCode === 200){
    console.log("Got previous meeting from Rescheduled State");
    //extract the previous meeting id; 
    previousMeetingID = getReScheduledResponse.data[0].id;
  }

  console.log("Previous meeting id: ", previousMeetingID)


  //change the outcome
  const outcomeResponse = await updateMeetingOutcome(previousMeetingID, "CANCELED")
  if(outcomeResponse.statusCode === 200){
    console.log("outcome of previous meeting changed successfully: ", outcomeResponse.data)
  }else{
    console.error("Could not change outcome of previous meeting: ", outcomeResponse.message)
  }

  const phoneResult = await getPhoneNumberByContactId(contactId);
  if (phoneResult.statusCode != 200){
    console.error("Could not find associated phone number: ", phoneResult.message);
  }
  const phoneNumber = phoneResult.data.phone

  //create a note for the cancelling of booking
  const noteResult = await handleNoteCreation(`Booking has been cancelled. BookingUID = ${bookingUID}`, phoneNumber)
  if(noteResult.statusCode === 200){
    console.log("note created for cancelleed booking"); 
  }else{
    console.error("Error creating note: ", noteResult.message);
  }

  // Cancel any scheduled messages
  const cancelScheduledMessageResult = await handleCancelMessage(phoneNumber);
  if(cancelScheduledMessageResult.statusCode === 200){
    console.log("Scheduled message cancelled successfully: ", cancelScheduledMessageResult.data);
  }else{
    console.error("Failed to cancel scheduled message: ", cancelScheduledMessageResult.message);
  }
  
  if (cancelScheduledMessageResult.statusCode !== 200) {
    console.error(`Error cancelling messages: (${cancelScheduledMessageResult.statusCode}): ${cancelScheduledMessageResult.message}`);
    return; // Exit if unable to cancel scheduled messages
  }

  //update lead status
  console.log("Updating lead status");
  const leadStatusResponse = await updateLeadStatus(contactId, "APPOINTMENT_CANCELLED");

  if (leadStatusResponse.statusCode !== 200) {
      console.error(`Failed to update lead status: ${leadStatusResponse.message}`);
      twiml.message("An error occurred while updating your appointment status. Please try again later.");
      return;
  }


  console.log("Lead status updated successfully");

  console.log('Scheduled messages cancelled successfully.');
}

// Start the Express server on port 3001
app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});