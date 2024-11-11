
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const deleteBooking = require('../cal/deleteBooking');
const scheduleMsg = require('../twilio/scheduleMsg24')
const app = express();

// Middleware to parse incoming Twilio messages
app.use(express.urlencoded({ extended: true }));



app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body; // Retrieve the message text
  const fromNumber = req.body.From; // Retrieve the sender's number

  console.log(`Received message from ${fromNumber}: ${incomingMessage}`);

  // Example response based on the incoming message
  if (incomingMessage.toLowerCase().includes("hello")) {
    twiml.message("Hello! How can I assist you today?");
  } else {
    twiml.message("Thank you for your message. We will get back to you soon.");
  }

  if (incomingMessage.toLowerCase().trim() === "cancel") {
    deleteBooking.deleteBooking(fromNumber);
    twiml.message("Thank you, we will send you a cancel confirmation soon");
  } else {
    twiml.message("Please respond with either Cancel | Reschedule | Yes");
  }

  if (incomingMessage.toLowerCase().trim() === "reschedule") {
    twiml.message("Thank you, we will send you a cancel confirmation soon");
  } else {
    twiml.message("Please respond with either Cancel | Reschedule | Yes");
  }

  if (incomingMessage.toLowerCase().trim() === "yes") {
    scheduleMsg.scheduleMsg(fromNumber)
    twiml.message("Thank you for confirming your appointment");
  } else {
    twiml.message("Please respond with either Cancel | Reschedule | Yes");
  }


  // Send the TwiML response
  res.type('text/xml').send(twiml.toString());
});

app.listen(3000, () => {
  console.log('Express server listening on port 3000');
});


