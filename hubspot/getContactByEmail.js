require('dotenv').config();
const hubspot = require('@hubspot/api-client');

// Initialize HubSpot client with access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Function to fetch user ID by email
async function getUserIdByEmail(email) {
    try {
        // Validate inputs
        if (!email) {
            return {
                statusCode: 400,
                message: 'Email is required',
                data: null,
            };
        }

        const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
        if (!accessToken) {
            return {
                statusCode: 500,
                message: 'HubSpot access token is missing. Please check your environment variables.',
                data: null,
            };
        }

        // Define the search request
        const searchRequest = {
            filterGroups: [{
                filters: [{
                    propertyName: 'email',
                    operator: 'EQ',
                    value: email
                }]
            }],
            properties: ['email']
        };

        console.log('Searching for contact with email:', email);

        // Perform the search
        const apiResponse = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest);

        // Access results from apiResponse.body
        const results = apiResponse.results;

        // Check if a contact was found
        if (results && results.length > 0) {
            const userId = results[0].id;
            console.log('User ID found:', userId);
            return {
                statusCode: 200,
                message: 'User ID retrieved successfully',
                data: { userId },
            };
        } else {
            console.log('No user found with this email');
            return {
                statusCode: 404,
                message: 'No user found with this email',
                data: null,
            };
        }
    } catch (error) {
        console.error('Error fetching contact:', error.message);

        return {
            statusCode: error.response?.status || 500,
            message: error.response?.body?.message || 'An unknown error occurred',
            data: null,
        };
    }
}

// // Example usage
// (async () => {
//     const email = "fwani616@gmail.com"; // Replace with actual email

//     const result = await getUserIdByEmail(email);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//         console.log('User ID:', result.data.userId);
//     } else if (result.statusCode === 404) {
//         console.warn(result.message);
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();

module.exports = { getUserIdByEmail };