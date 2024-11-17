//This is the bottom number 
//+61 483 968 666

// Import dotenv to load environment variables
require('dotenv').config();
const twilio = require("twilio");

// Retrieve Twilio credentials from environment variables
const accountSid = process.env.MSG_ACC_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Ensure credentials are present
if (!accountSid || !authToken) {
  console.error("Error: Missing Twilio credentials in environment variables.");
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function createMessage() {
  try {
    const message = await client.messages.create({
      body: "hello",
      from: "+61483968666", // 1st number (twilio acc)
      to: "+61483963666",   // 2nd number (reciever)
    });
    console.log("Message sent successfully:", message.body);
  } catch (error) {
    console.error("Error creating message:", error);
  }
}

// Call the function to send the message
createMessage();
