const hubspot = require('@hubspot/api-client');
require('dotenv').config();

// Function to fetch user ID by phone number
async function getUserIdByPhone(phoneNumber) {
    //TODO --
    phoneNumber = "+36705543726"
    try {
        // Validate inputs
        if (!phoneNumber) {
            return {
                statusCode: 400,
                message: 'Phone number is required',
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

        const hubspotClient = new hubspot.Client({ accessToken });

        // Define the search request
        const PublicObjectSearchRequest = {
            query: phoneNumber,
            limit: 1,
        };

        console.log('Searching for contact with phone number:', phoneNumber);

        // Perform the search
        const apiResponse = await hubspotClient.crm.contacts.searchApi.doSearch(PublicObjectSearchRequest);

        // Check if a contact was found
        if (apiResponse.results && apiResponse.results.length > 0) {
            const userId = apiResponse.results[0].id;
            console.log('User ID found:', userId);
            return {
                statusCode: 200,
                message: 'User ID retrieved successfully',
                data: { userId },
            };
        } else {
            console.log('No user found with this phone number');
            return {
                statusCode: 404,
                message: 'No user found with this phone number',
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

//Example usage

// (async () => {
//     const phoneNumber = "705543726"; // Replace with actual phone number

//     const result = await getUserIdByPhone(phoneNumber);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//         console.log('User ID:', result.data.userId);
//     } else if (result.statusCode === 404) {
//         console.warn(result.message);
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();

module.exports = { getUserIdByPhone };