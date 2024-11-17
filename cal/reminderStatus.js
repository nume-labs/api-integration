require('dotenv').config();
const fetch = require('node-fetch'); // Ensure node-fetch is imported if used in Node.js

const API_KEY = process.env.API_KEY;

// Function to get booking by ID
async function getBooking(bookingId) {
    const url = `https://api.cal.com/v1/bookings/${bookingId}?apiKey=${API_KEY}`;
  
    const options = { method: 'GET' };
  
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error('Error:', error);
      return error;
    }
}

// Function to calculate which reminder should be scheduled next
function calculateNextReminder(startTime) {
    const now = new Date();
    const bookingTime = new Date(startTime);

    // Calculate the difference in milliseconds
    const diffMs = bookingTime - now;

    // Convert milliseconds to hours
    const diffHours = diffMs / (1000 * 60 * 60);

    // Determine which reminder needs to be scheduled next
    if (diffHours > 24) {
        console.log("Schedule 24-hour reminder");
        return 24;
    } else if (diffHours > 12) {
        console.log("Schedule 12-hour reminder");
        return 12;
    } else if (diffHours > 1) {
        console.log("Schedule 1-hour reminder");
        return 1;
    } else {
        console.log("No reminder needed at this time");
        return null;
    }
}

// calculateNextReminder("2024-11-15T10:00:00.000Z")

// Main function to check and schedule the next reminder
async function checkAndScheduleNextReminder(bookingId) {
    // Fetch the booking details first
    const response = await getBooking(bookingId);
    
    // Ensure we have a valid startTime in the response
    if (response.booking && response.booking.startTime) {
        const startTime = response.booking.startTime;
        
        // Calculate which reminder should be scheduled next
        const nextReminder = calculateNextReminder(startTime);

        if (nextReminder !== null) {
            console.log(`Next reminder to schedule: ${nextReminder}-hour`);
            // Here you would implement your actual scheduling logic for this reminder
            // Example: scheduleReminder(nextReminder, startTime);
        }
        
    } else {
        console.error('Invalid response structure: startTime is missing.');
    }
}

// Call checkAndScheduleNextReminder with a valid booking ID
checkAndScheduleNextReminder(4390487);
