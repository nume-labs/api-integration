
const express = require('express');
const { MessagingResponse } = require('twilio').twiml;
const deleteBooking = require('../cal/deleteBooking');
const scheduleMsg = require('../twilio/scheduleMsg24');
const createNote = require('../hubspot/createNote');
const findUser = require('../hubspot/findUserByPhone');
const app = express();

// Middleware to parse incoming Twilio messages
app.use(express.urlencoded({ extended: true }));



app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMessage = req.body.Body; // Retrieve the message text
  const fromNumber = req.body.From; // Retrieve the sender's number

  console.log(`Received message from ${fromNumber}: ${incomingMessage}`);

  //make a note of the message
  createNote.createNote(incomingMessage, fromNumber)


  // Example response based on the incoming message
  if (incomingMessage.toLowerCase().includes("hello")) {
    twiml.message("Hello! How can I assist you today?");
  } else {
    twiml.message("Thank you for your message. We will get back to you soon.");
  }

  if (incomingMessage.toLowerCase().trim() === "cancel") {

    //delete the booking
    deleteBooking.deleteBooking(fromNumber);

    //find userID via phoneNumber
    findUser.getUserIdByPhone(phoneNumber)
    .then(response => {
      const userID = response.results?.[0]?.id;
      console.log("This is the response: ", userID);
    })
    .catch(error => {
      console.error("Error:", error);
    });

    createNote.createNote("Contact cancelled appointment: ", userID)
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
    //find userID via phoneNumber
    findUser.getUserIdByPhone(phoneNumber)
    .then(response => {
      const userID = response.results?.[0]?.id;
      console.log("This is the response: ", userID);
    })
    .catch(error => {
      console.error("Error:", error);
    });
    //create the note
    createNote.createNote("Contact confirmed appointment: ", userID)

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


