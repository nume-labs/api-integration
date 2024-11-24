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
        
        if (!response.ok) {
            return {
                statusCode: response.status,
                message: `HTTP error! status: ${response.status}`,
                data: null
            };
        }
        
        const data = await response.json();
        // console.log(data);
        return {
            statusCode: 200,
            message: 'Booking retrieved successfully',
            data: data
        };
    } catch (error) {
        return {
            status: 'error',
            statusCode: 500,
            message: error.message,
            data: null
        };
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
        // Validate inputs
        if (!body || !sendAt || !to) {
            return {
                statusCode: 400,
                message: 'Missing required parameters: body, sendAt, or to',
                data: null,
            };
        }
        console.log('inputs are valid');

        const message = await client.messages.create({
            body: body,
            messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
            scheduleType: "fixed",
            sendAt: sendAt.toISOString(),
            to: to,
        });

        console.log(`Scheduled message successfully: ${message.sid}`);

        return {
            statusCode: 200,
            message: 'Message scheduled successfully',
            data: { sid: message.sid },
        };
    } catch (error) {
        console.error('Error scheduling message:', error.message);

        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}


async function checkAndScheduleNextReminder(bookingId, phoneNumber) {
    try {
        // Validate inputs
        if (!bookingId || !phoneNumber) {
            return {
                statusCode: 400,
                message: 'Missing required parameters: bookingId or phoneNumber',
                data: null,
            };
        }

        console.log('Getting booking...');
        const bookingResponse = await getBooking(bookingId);

        // Check if booking retrieval was successful
        if (bookingResponse.statusCode !== 200) {
            return {
                statusCode: bookingResponse.statusCode,
                message: `Failed to retrieve booking: ${bookingResponse.message}`,
                data: null,
            };
        }

        const booking = bookingResponse.data.booking;

        // Validate booking data
        if (!booking || !booking.startTime) {
            return {
                statusCode: 400,
                message: 'Invalid booking data: startTime is missing',
                data: null,
            };
        }

        console.log('Getting user ID...');
        const userId = await getUserIdByPhone(phoneNumber); // Replace with actual phone number logic
        if (!userId) {
            return {
                statusCode: 404,
                message: 'User ID not found for the given phone number',
                data: null,
            };
        }

        console.log('Getting lead status...');
        const leadStatus = await getContactLeadStatus(userId);

        const startTime = new Date(booking.startTime);
        const nextReminder = calculateNextReminder(startTime);

        if (nextReminder === null) {
            return {
                statusCode: 200,
                message: 'No reminder needed at this time',
                data: null,
            };
        }

        console.log(`Scheduling ${nextReminder}-hour reminder...`);

        // Calculate sendAt time
        const sendAt = new Date(startTime.getTime() - nextReminder * 60 * 60 * 1000);

        // Build message body based on lead status
        let body = '';
        if (leadStatus === 'OPEN_DEAL') {
            body = `Reminder: Your appointment is in ${nextReminder} hour${nextReminder > 1 ? 's' : ''}.`;
        } else {
            body = `Reminder: Your appointment is in ${nextReminder} hour${nextReminder > 1 ? 's' : ''}. Please confirm your attendance.`;
        }

        // Check if a message with the same body is already scheduled
        //TODO--> CHANGE TO PHONE NUMBER VARIABLE
        const existingMessageResponse = await checkExistingScheduledMessage("+61483963666", body);

        if (existingMessageResponse.statusCode !== 200) {
            return {
                statusCode: existingMessageResponse.statusCode,
                message: `Failed to check existing scheduled messages: ${existingMessageResponse.message}`,
                data: null,
            };
        }

        if (existingMessageResponse.data.exists) {
            console.log('A message with the same content is already scheduled. Skipping scheduling.');
            return {
                statusCode: 200,
                message: 'A matching scheduled message already exists. Skipping scheduling.',
                data: null,
            };
        }

        // Send the scheduled message
        console.log('Sending scheduled message...');
        //TODO --> CHANGE THE PHONE NUMBER TO VAR
        const sendMessageResponse = await sendScheduledMessage(body, sendAt, "+61483963666");

        if (sendMessageResponse.statusCode !== 200) {
            return {
                statusCode: sendMessageResponse.statusCode,
                message: `Failed to schedule message: ${sendMessageResponse.message}`,
                data: null,
            };
        }

        console.log(`Scheduled message successfully. Response SID: ${sendMessageResponse.data.sid}`);
        
        return {
            statusCode: 200,
            message: 'Reminder scheduled successfully',
            data: { sid: sendMessageResponse.data.sid },
        };
    } catch (error) {
        console.error('Error in checkAndScheduleNextReminder:', error.message);
        
        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

async function checkExistingScheduledMessage(phoneNumber, body) {
    try {
        // Validate inputs
        if (!phoneNumber || !body) {
            return {
                statusCode: 400,
                message: 'Missing required parameters: phoneNumber or body',
                data: null,
            };
        }

        // Retrieve scheduled messages
        const scheduledMessagesResponse = await listScheduledMessages(phoneNumber);

        // Check if the retrieval was successful
        if (scheduledMessagesResponse.statusCode !== 200) {
            return {
                statusCode: scheduledMessagesResponse.statusCode,
                message: `Failed to retrieve scheduled messages: ${scheduledMessagesResponse.message}`,
                data: null,
            };
        }

        const scheduledMessages = scheduledMessagesResponse.data;

        // Normalize body for comparison (e.g., trim spaces, convert to lowercase)
        const normalizedBody = body.trim().toLowerCase();

        // Check if any existing message matches the normalized body
        const exists = scheduledMessages.some(
            (message) => message.body.trim().toLowerCase() === normalizedBody
        );

        return {
            statusCode: 200,
            message: exists
                ? 'A matching scheduled message was found'
                : 'No matching scheduled message found',
            data: { exists },
        };
    } catch (error) {
        console.error('Error checking existing scheduled messages:', error.message);

        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

async function cancelMsg(sid) {
    try {
        // Validate input
        if (!sid) {
            return {
                statusCode: 400,
                message: 'Message SID is required',
                data: null,
            };
        }

        // Attempt to cancel the message
        const message = await client.messages(sid).update({ status: 'canceled' });

        console.log(`Message canceled successfully. SID: ${message.sid}`);

        return {
            statusCode: 200,
            message: 'Message canceled successfully',
            data: { sid: message.sid, body: message.body },
        };
    } catch (error) {
        console.error('Error canceling message:', error.message);

        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}


async function listScheduledMessages(phoneNumber) {
    try {
        // Validate input
        if (!phoneNumber) {
            return {
                statusCode: 400,
                message: 'Phone number is required',
                data: null,
            };
        }

        // Fetch all messages for the given phone number
        const allMessages = await client.messages.list({
            to: phoneNumber,
            limit: 20,
        });

        // Filter messages with "scheduled" status
        const scheduledMessages = allMessages.filter(
            (message) => message.status === 'scheduled'
        );

        // Log the scheduled messages for debugging
        scheduledMessages.forEach((m) =>
            console.log(`Message SID: ${m.sid}, Body: ${m.body}, Status: ${m.status}`)
        );

        return {
            statusCode: 200,
            message: 'Scheduled messages retrieved successfully',
            data: scheduledMessages,
        };
    } catch (error) {
        console.error('Error listing scheduled messages:', error.message);

        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

//BELOW ARE EXAMPLE TESTS

// async function testcancel(){
//     const response = await listScheduledMessages('+61483963666');
//     console.log(response);
// }

// testcancel();

// async function sendschmsg(bookingId){
//     try {
//         const response = await checkAndScheduleNextReminder(bookingId, "+705543726");
//         console.log("Response:", response);
//     } catch (error) {
//         if (error.response) {
//             console.error("API Response Error:", error.response.status, error.response.data);
//         } else {
//             console.error("Error:", error.message);
//         }
//     }
// }

// sendschmsg(4520291);


// cancelMsg('SM9a71659784694300b3bf674c78eb5306')

// async function testbooking(bookingId){
//     const result = await getBooking(bookingId);
//     if (result.status === 'error') {
//         console.error(`Error: ${result.message} (Status code: ${result.statusCode})`);
//         console.log(result);
//     } else {
//         console.log(`Success: ${result.message}`);
//         // Process result.data
//     }
// }

// testbooking(4520291);





module.exports = {
    checkAndScheduleNextReminder,
    calculateNextReminder,
    getBooking, 
    cancelMsg, 
    listScheduledMessages
};
