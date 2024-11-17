require('dotenv').config();
const twilio = require("twilio");
const cal = require('../cal/getBookingById');
const { ModuleDataManagementInstance } = require('twilio/lib/rest/marketplace/v1/moduleDataManagement');


// Find your Account SID and Auth Token at twilio.com/console
const accountSid = process.env.MSG_ACC_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const msgServiceSid = process.env.MSG_SERVICE_SID;

const client = twilio(accountSid, authToken);

if (!accountSid || !authToken) {
  console.error("Error: Missing Twilio credentials in environment variables.");
  process.exit(1);
}

async function createReminder(appointmentDate, number, hoursBeforeAppointment) {
  // Calculate reminder time as 24 hours before the appointment date
  const reminderDate = new Date(appointmentDate);

  
  // reminder needs to be updated here (incremented)



  reminderDate.setHours(reminderDate.getHours() - hoursBeforeAppointment);

  try {
    const message = await client.messages.create({
      body: `This is a reminder for your appointment in ${hoursBeforeAppointment} hours.`,
      messagingServiceSid: msgServiceSid,
      scheduleType: "fixed",
      sendAt: reminderDate,
      to: number,
    });

    console.log("Scheduled message:", message.body);
  } catch (error) {
    console.error("Failed to schedule message:", error.message);
  }
}

// Example appointment date
const appointmentDate = new Date("2024-11-14T20:36:27");
const number = "+61483963666"; 
const hoursBeforeAppointment = 24;

// createReminder(appointmentDate, testNumber, hoursBeforeAppointment);

//we have to know which reminder to send (24, 12, 1)

function whichReminder(bookingId){
  const reminderStatus = cal.decideReminder(bookingId)

}

module.exports = createReminder
