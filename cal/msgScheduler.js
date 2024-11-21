require('dotenv').config();
const { response } = require('express');
const fetch = require('node-fetch');
const twilio = require('twilio');

const {getContactLeadStatus} = require('../hubspot/updateLead')
const {getUserIdByPhone} = require('../hubspot/findUserByPhone')

const API_KEY = process.env.CAL_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_MESSAGING_SERVICE_SID = process.env.MSG_SERVICE_SID;

const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function getBooking(bookingId) {
    const url = `https://api.cal.com/v1/bookings/${bookingId}?apiKey=${API_KEY}`;
    const options = { method: 'GET' };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function calculateNextReminder(startTime) {
    const now = new Date();
    const bookingTime = new Date(startTime);
    const diffMs = bookingTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 24) return 24;
    if (diffHours > 12) return 12;
    if (diffHours > 1) return 1;
    return null;
}

async function sendScheduledMessage(body, sendAt, to) {
    try {
        console.log(TWILIO_MESSAGING_SERVICE_SID)
        const message = await client.messages.create({
            body: body,
            messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
            scheduleType: "fixed",
            sendAt: sendAt.toISOString(),
            to: to,
        });
        console.log(`Scheduled message: ${message.sid}`);
        return message;
    } catch (error) {
        console.error('Error scheduling message:', error);
        throw error;
    }
}


async function checkAndScheduleNextReminder(bookingId, phoneNumber) {
    try {
        //call the getbooking function
        console.log("getting booking");
        const response = await getBooking(bookingId);
        console.log("got booking");

        console.log("getting userid");
        // const userId = await getUserIdByPhone(phoneNumber);
        const userId = await getUserIdByPhone("705543726");
        console.log("user id: ", userId);
        console.log("got userid");

        console.log("getting lead status");
        const leadStatus = await getContactLeadStatus(userId);
        console.log("got lead status");
        
        //error handling, if start time is elapsed or missing
        if (!response.booking || !response.booking.startTime) {
            throw new Error('Invalid response structure: startTime is missing.');
        }

        const startTime = new Date(response.booking.startTime);
        const nextReminder = calculateNextReminder(startTime);

        if (nextReminder !== null) {
            console.log(`Scheduling ${nextReminder}-hour reminder`);

            //calculate sendAt time.
            const sendAt = new Date(startTime.getTime() - nextReminder * 60 * 60 * 1000);

            const body = "";
            //build message body
            if(leadStatus === "OPEN_DEAL" ){ //TODO --> ask taskin what this status should be
                body = `Reminder: Your appointment is in ${nextReminder} hour${nextReminder > 1 ? 's' : ''}.`;
            }else{
                body = `Reminder: Your appointment is in ${nextReminder} hour${nextReminder > 1 ? 's' : ''}., please confirm your attendance`;
            }
            
        
            // Check if a message with the same body is already scheduled
            const isAlreadyScheduled = await checkExistingScheduledMessage(phoneNumber, body);
            
            //check if message is already scheduled (rate limiter can also be applied under this block)
            if (isAlreadyScheduled) {
                console.log("A message with the same content is already scheduled. Skipping scheduling.");
            } else {
                //send the message
                const response = await sendScheduledMessage(body, sendAt, phoneNumber);
                console.log(`response: ${JSON.stringify(response, null, 2)}`);
            }
        } else {
            console.log("No reminder needed at this time");
        }
    } catch (error) {
        console.error('Error in checkAndScheduleNextReminder:', error);
    }
}

async function checkExistingScheduledMessage(phoneNumber, body) {
    //get a list of all scheduled messages to phoneNumber
    const scheduledMessages = await listScheduledMessages(phoneNumber);

    //from scheduledMessages, check if the bodies match.
    return scheduledMessages.some(message => message.body === body);
}


async function cancelMsg(sid) {
  const message = await client
    .messages(sid)
    .update({ status: "canceled" });

  console.log(message.body);
}



async function listAllMessages(phoneNumber) {
  const messages = await client.messages.list({
    to: phoneNumber,
    limit: 20,
  });

  messages.forEach((m) => console.log(m.body, m.sid, m.status));
}

async function listScheduledMessages(phoneNumber) {
    try {
        const allMessages = await client.messages.list({
            to: phoneNumber,
            limit: 20,
        });

        //filter scheduled messages directed towards phoneNumber.
        const scheduledMessages = allMessages.filter(message => message.status === 'scheduled');

        // Log the scheduled messages for debugging
        scheduledMessages.forEach(m => console.log(m.body, m.sid, m.status));
        console.log(scheduledMessages);

        // Return the list of scheduled messages
        return scheduledMessages;
    } catch (error) {
        console.error('Error listing scheduled messages:', error);
        throw error;
    }
}

// listScheduledMessages("+61483963666")

// Example usage
checkAndScheduleNextReminder(4390487, "+61483963666");

module.exports = {
    checkAndScheduleNextReminder,
    calculateNextReminder,
    getBooking, 
    cancelMsg
};
