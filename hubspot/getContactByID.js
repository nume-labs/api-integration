const hubspot = require('@hubspot/api-client');
require('dotenv').config();

// Initialize HubSpot client
const token = process.env.HUBSPOT_ACCESS_TOKEN;

// Validate the token during initialization
if (!token) {
    console.error('HubSpot access token is missing. Please check your environment variables.');
    process.exit(1);
}

const hubspotClient = new hubspot.Client({ accessToken: token });

// Default parameters for the API call
const properties = undefined;
const propertiesWithHistory = undefined;
const associations = undefined;
const archived = false;

// Function to retrieve a contact by ID
async function getContactById(contactId) {
    try {
        // Validate input
        if (!contactId) {
            return {
                statusCode: 400,
                message: 'Contact ID is required',
                data: null,
            };
        }

        console.log('Fetching contact with ID:', contactId);

        // Make the API request
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(
            contactId,
            properties,
            propertiesWithHistory,
            associations,
            archived
        );

        console.log('Contact retrieved successfully:', JSON.stringify(apiResponse, null, 2));

        return {
            statusCode: 200,
            message: 'Contact retrieved successfully',
            data: apiResponse,
        };
    } catch (error) {
        console.error('Error retrieving contact:', error.message);

        if (error.message === 'HTTP request failed' && error.response) {
            console.error('Response details:', JSON.stringify(error.response, null, 2));
            return {
                statusCode: error.response.status || 500,
                message: error.response.body?.message || 'An unknown error occurred',
                data: null,
            };
        }

        return {
            statusCode: 500,
            message: error.message || 'An unknown error occurred',
            data: null,
        };
    }
}

// Export the function for use in other modules
module.exports = { getContactById };

// Example usage
(async () => {
    const contactId = 71196564006; // Replace with actual contact ID

    const result = await getContactById(contactId);

    if (result.statusCode === 200) {
        console.log(result.message);
        console.log('Contact Details:', result.data);
    } else {
        console.error(`Error (${result.statusCode}): ${result.message}`);
    }
})();