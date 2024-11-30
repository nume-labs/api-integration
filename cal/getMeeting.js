require('dotenv').config();
const axios = require('axios');

// Environment variable for security
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Function to construct the search request body

//TODO --> FILTER FOR EMAIL
function createSearchBody(contactId) {
    return {
        filters: [
            {
                propertyName: 'associations.contact',
                operator: 'EQ',
                value: contactId, // Contact ID to filter meetings
            },
        ],
        properties: [
            'hs_body_preview' // Specify the property you want to retrieve
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

        // Log each meeting in the results array
        const meetings = response.data.results;
        console.log('Meetings fetched successfully. Details:');
        meetings.forEach((meeting, index) => {
            console.log(`Meeting ${index + 1}:`, JSON.stringify(meeting, null, 2));
        });

        return {
            statusCode: 200,
            message: 'Meetings fetched successfully',
            data: response.data,
        };
    } catch (error) {
        // Handle errors gracefully
        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

async function getMeetingIdByContactId(contactId) {
    // Call the function that fetches all meeting data
    const response = await searchMeetingsByContact(contactId);

    // Log the full response for debugging
    // console.log('Response:', JSON.stringify(response, null, 2));

    // Check if the response is successful
    if (response && response.statusCode === 200) {
        // Ensure results array exists and has at least one item
        if (response.data.results && response.data.results.length > 0) {
            // Extract the first meeting ID from the results
            const meetingId = response.data.results[0].id;

            // Return the meeting ID
            return {meetingId, statusCode: 200};
        } else {
            // console.error('No meetings found for this contact.');
            return null; // No meetings found
        }
    } else {
        // Log error details if the request failed
        const statusCode = response?.statusCode || 'undefined';
        const message = response?.message || 'An unknown error occurred.';
        console.error(`Error (${statusCode}): ${message}`);
        return response; // Return full response for debugging in case of error
    }
}
// Example usage
// (async () => {
//     const contactId = '71196564006'; // Replace with your contact ID

//     const result = await searchMeetingsByContact(contactId);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();

// (async () => {
//     const contactId = "71196564006"; 
//     const result = await getMeetingIdByContactId(contactId); 
//     console.log(result, result.statusCode);
// })();

module.exports = {
    searchMeetingsByContact, 
    getMeetingIdByContactId
}