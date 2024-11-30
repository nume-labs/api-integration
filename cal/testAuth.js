require('dotenv').config();
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');

const app = express();
app.use(express.urlencoded({ extended: true }));

// Replace these with your application's credentials
const CLIENT_ID = process.env.CAL_CLIENT_ID;
const CLIENT_SECRET = process.env.CAL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/callback';
const AUTHORIZATION_URL = 'https://app.cal.com/auth/oauth2/authorize';
const TOKEN_URL = 'https://app.cal.com/api/auth/oauth/token';

// Step 1: Redirect user to Cal.com's authorization page
app.get('/login', (req, res) => {
  const authUrl = `${AUTHORIZATION_URL}?` + 
    querystring.stringify({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'READ_BOOKING WRITE_BOOKING',
      state: 'random_state_string' // Securely generate this in production
    });
  
  console.log('Redirecting to:', authUrl);
  res.redirect(authUrl);
});

// Step 2: Handle the callback from Cal.com and exchange code for token
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    console.error('Authorization code not found in callback');
    return res.status(400).send('Authorization code not found');
  }

  console.log('Received authorization code:', code);

  try {
    const response = await axios.post(TOKEN_URL, querystring.stringify({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: code,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = response.data;
    console.log('Access Token received:', access_token);

    // Step 3: Use the access token to make an authenticated API request
    try {
      const apiResponse = await axios.get('https://api.cal.com/v1/bookings', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      console.log('API Response:', apiResponse.data);
      res.json(apiResponse.data);
    } catch (apiError) {
      console.error('Error fetching bookings:', apiError.response ? apiError.response.data : apiError.message);
      res.status(apiError.response ? apiError.response.status : 500).send('Error fetching bookings');
    }
  } catch (tokenError) {
    console.error('Error fetching access token:', tokenError.response ? tokenError.response.data : tokenError.message);
    res.status(tokenError.response ? tokenError.response.status : 500).send('Error fetching access token');
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log('Server running on http://localhost:3001/login');
});