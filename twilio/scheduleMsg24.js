require('dotenv').config();
const twilio = require("twilio");

// Find your Account SID and Auth Token at twilio.com/console
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const msgServiceSid = process.env.MSG_SERVICE_SID;
const client = twilio(accountSid, authToken);

if (!accountSid || !authToken) {
  console.error("Error: Missing Twilio credentials in environment variables.");
  process.exit(1);
}

async function createReminder(appointmentDate, testNumber, hoursBeforeAppointment) {
  // Calculate reminder time as 24 hours before the appointment date
  const reminderDate = new Date(appointmentDate);
  reminderDate.setHours(reminderDate.getHours() - hoursBeforeAppointment);

  try {
    const message = await client.messages.create({
      body: "This is a 24-hour reminder for your appointment.",
      messagingServiceSid: msgServiceSid,
      scheduleType: "fixed",
      sendAt: reminderDate,
      to: testNumber,
    });

    console.log("Scheduled message:", message.body);
  } catch (error) {
    console.error("Failed to schedule message:", error.message);
  }
}

// Example appointment date
const appointmentDate = new Date("2024-11-14T20:36:27");
const testNumber = "+61483963666"; 
const hoursBeforeAppointment = 24;
createMessage(appointmentDate, testNumber, hoursBeforeAppointment);
