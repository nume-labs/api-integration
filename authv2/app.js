require('dotenv').config();
const express = require('express');

const axios = require('axios');

const hubspot = require('@hubspot/api-client');

const app = express();
const PORT = process.env.PORT || 3000;

const clientID = process.env.HUBSPOT_CLIENT_ID;

const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

// const redirectUri = process.env.REDIRECT_URI;
const redirectUri = "http://localhost:3000/callback";
const scope = "crm.objects.contacts.read"


let hubspotClient;
let refreshToken;

app.get('/install', (req, res) => {

    console.log(clientID, clientSecret, redirectUri)
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectUri}&scope=${scope}`;
    res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const tokenResponse = await exchangeForTokens(code);
        initializeHubSpotClient(tokenResponse);
        res.send('Authentication successful! You can now use the HubSpot API.');
    } catch (error) {
        console.error('Error during OAuth flow:', error);
        res.status(500).send('Error during authentication');
    }
});

async function exchangeForTokens(code) {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
            grant_type: 'authorization_code',
            client_id: clientID,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code: code,
        },
    });
    return response.data;
}

function initializeHubSpotClient(tokens) {
    refreshToken = tokens.refresh_token;
    hubspotClient = new hubspot.Client({ accessToken: tokens.access_token });
    
    // Set up automatic token refresh
    setInterval(async () => {
        try {
            const refreshedTokens = await refreshAccessToken();
            hubspotClient = new hubspot.Client({ accessToken: refreshedTokens.access_token });
            console.log('Access token refreshed successfully');
        } catch (error) {
            console.error('Error refreshing access token:', error);
        }
    }, (tokens.expires_in - 300) * 1000); // Refresh 5 minutes before expiration
}

async function refreshAccessToken() {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
            grant_type: 'refresh_token',
            client_id: clientID,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        },
    });
    refreshToken = response.data.refresh_token;
    return response.data;
}

// Example API call
app.get('/api/contacts', async (req, res) => {
    try {
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getPage();
        res.json(apiResponse);
    } catch (error) {
        console.error('Error calling HubSpot API:', error);
        res.status(500).send('Error retrieving contacts');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`To start OAuth flow, visit: http://localhost:${PORT}/install`);
});