require('dotenv').config();
const axios = require('axios');

const clientID = process.env.CAL_CLIENT_ID; // Replace with your actual client ID
const clientSecret = process.env.CAL_CLIENT_SECRET; // Replace with your actual client secret

async function listBookings() {
  try {
    const response = await axios.get('https://api.cal.com/v2/listBookings', {
      headers: {
        'x-cal-client-id': clientID,
        'x-cal-secret-key': clientSecret
      }
    });

    console.log('Bookings:', response.data);
  } catch (error) {
    console.error('Error fetching bookings:', error.response ? error.response.data : error.message);
  }
}

listBookings();