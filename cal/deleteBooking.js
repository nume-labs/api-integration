require('dotenv').config();
// Load environment variable for the API key
const API_KEY = process.env.API_KEY;

// Function to cancel a booking by ID
async function deleteBooking(bookingId) {
  const url = `https://api.cal.com/v1/bookings/${bookingId}/cancel?apiKey=${API_KEY}`;

  const options = { method: 'DELETE' };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// model.exports = deleteBooking
// Example usage
// deleteBooking('91'); // Pass the specific booking ID here
