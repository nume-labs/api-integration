require('dotenv').config();
const hubspot = require('@hubspot/api-client');

// Initialize the HubSpot client with your access token
const token = process.env.HUBSPOT_ACCESS_TOKEN;

// Validate the token during initialization
if (!token) {
    console.error('HubSpot access token is missing. Please check your environment variables.');
    process.exit(1);
}

const hubspotClient = new hubspot.Client({ accessToken: token });

// Default parameters for the API call
const properties = ["lifecyclestage"];
const propertiesWithHistory = undefined;
const associations = undefined;
const archived = false;

// Function to retrieve the lead status (lifecycle stage) of a contact
async function getLifeCycleStage(contactId) {
    try {
        // Validate input
        if (!contactId) {
            return {
                statusCode: 400,
                message: 'Contact ID is required',
                data: null,
            };
        }

        console.log('Fetching lead status for contact ID:', contactId);

        // Make the API request
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(
            contactId,
            properties,
            propertiesWithHistory,
            associations,
            archived
        );

        // Extract the lifecycle stage from the response
        const lifecycleStage = apiResponse.properties?.lifecyclestage;

        if (!lifecycleStage) {
            return {
                statusCode: 404,
                message: 'Lifecycle stage not found for the given contact',
                data: null,
            };
        }

        console.log('Lead status (lifecycle stage) retrieved successfully:', lifecycleStage);

        return {
            statusCode: 200,
            message: 'Lead status retrieved successfully',
            data: { lifecycleStage },
        };
    } catch (error) {
        console.error('Error fetching lead status:', error.message);

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

// //Example Usage
// (async () => {
//     const contactId = "120216225015"; // Replace with actual contact ID

//     const result = await getLifeCycleStage(contactId);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//         console.log('Lifecycle Stage:', result.data.lifecycleStage);
//     } else if (result.statusCode === 404) {
//         console.warn(result.message);
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();

module.exports = { getLifeCycleStage };