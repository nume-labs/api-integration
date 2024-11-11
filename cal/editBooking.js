require('dotenv').config();

// Environment variable for security
const API_KEY = process.env.API_KEY;

// Function to construct the booking update body
function createBookingUpdateBody({ title, start, end, status, description }) {
  return {
    title,
    start,
    end,
    status,
    description
  };
}

// Function to make the booking update request
async function updateBooking(bookingId, updateDetails) {
  const url = `https://api.cal.com/v1/bookings/${bookingId}?apiKey=${API_KEY}`;

  // Construct the body dynamically using the provided details
  const body = createBookingUpdateBody(updateDetails);

  const options = {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage
updateBooking(100, {
  title: "ExampleTitle",
  start: "2024-11-24T13:00:00.000Z",
  end: "2024-11-24T13:00:00.000Z",
  status: "ExampleStatus",
  description: "ExampleDesc"
});
