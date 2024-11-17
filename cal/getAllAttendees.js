// Load environment variables
require('dotenv').config();

const options = { method: 'GET' };
const apiKey = process.env.API_KEY;

fetch(`https://api.cal.com/v1/attendees?apiKey=${apiKey}`, options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
