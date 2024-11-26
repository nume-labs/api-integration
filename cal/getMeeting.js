require('dotenv').config();
const axios = require('axios');

// Environment variable for security
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Function to construct the search request body
function createSearchBody(contactId) {
    return {
        filters: [
            {
                propertyName: 'associations.contact',
                operator: 'EQ',
                value: contactId, // Contact ID to filter meetings
            },
        ],
        limit: 10, // Optional: Limit the number of results
    };
}

// Function to search for meetings by contact ID
async function searchMeetingsByContact(contactId) {
    try {
        // Validate inputs
        if (!HUBSPOT_ACCESS_TOKEN) {
            return {
                statusCode: 500,
                message: 'Access token is missing. Please check your environment variables.',
                data: null,
            };
        }

        if (!contactId) {
            return {
                statusCode: 400,
                message: 'Contact ID is required.',
                data: null,
            };
        }

        const url = 'https://api.hubapi.com/crm/v3/objects/meetings/search';
        const body = createSearchBody(contactId);

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`, // Use your private app's access token
            },
            data: body,
            url,
        };

        // Make the API request
        const response = await axios(options);

        if (response.status !== 200) {
            return {
                statusCode: response.status,
                message: `Failed to fetch meetings. HTTP status: ${response.status}`,
                data: null,
            };
        }

        return {
            statusCode: 200,
            message: 'Meetings fetched successfully',
            data: response.data,
        };
    } catch (error) {
        console.error('Error fetching meetings:', error.message);

        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

// // Example usage
// (async () => {
//     const contactId = '71196564006'; // Replace with your contact ID

//     const result = await searchMeetingsByContact(contactId);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//         console.log('Meetings:', result.data);
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();

module.exports = {
    searchMeetingsByContact
}