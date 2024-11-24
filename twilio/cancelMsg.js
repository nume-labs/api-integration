// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";
require('dotenv').config();

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

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

//Example Usage
// cancelMsg('SM6da706389682daadfb08b00492fbcca2')

module.exports = {
  cancelMsg
}