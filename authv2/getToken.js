const axios = require('axios');
const fs = require('fs').promises;

const TOKEN_FILE = './hubspot_token.json';

async function getToken() {
    try {
        const data = await fs.readFile(TOKEN_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

async function saveToken(token) {
    await fs.writeFile(TOKEN_FILE, JSON.stringify(token), 'utf8');
}

async function refreshToken(refreshToken) {
    const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
            grant_type: 'refresh_token',
            client_id: process.env.HUBSPOT_CLIENT_ID,
            client_secret: process.env.HUBSPOT_CLIENT_SECRET,
            refresh_token: refreshToken,
        },
    });
    return response.data;
}

module.exports ={
    getToken
}