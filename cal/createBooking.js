require('dotenv').config();

// Environment variable for security (use dotenv for Node.js if applicable)
const API_KEY = process.env.API_KEY;

// Function to construct the booking request body
function createBookingBody({ name, email, locationValue, locationOption, eventTypeId, start, end, timeZone, language }) {
  return {
    responses: {
      name,
      email,
      location: {
        optionValue: locationOption,
        value: locationValue
      }
    },
    eventTypeId,
    start,
    end,
    timeZone,
    language,
    metadata: {}
  };
}

// Function to make the booking request
async function createBooking(bookingDetails) {
  const url = `https://api.cal.com/v1/bookings?apiKey=${API_KEY}`;

  // Construct the body dynamically using the provided details
  const body = createBookingBody(bookingDetails);

  const options = {
    method: 'POST',
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
createBooking({
  name: "Faisal Test Wani",
  email: "fwani616@gmail.com",
  locationValue: "9717511173",
  locationOption: "phone",
  eventTypeId: 1365986,
  start: "2024-12-10T19:00:00.000Z",
  end: "2024-12-10T19:30:00.000Z",
  timeZone: "Asia/Kolkata",
  language: "English"
});
