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

// Function to retrieve lead status (hs_lead_status) for a contact
async function getContactLeadStatus(contactId) {
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

        // Define properties to fetch
        const properties = ["hs_lead_status"];
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(
            contactId,
            properties
        );

        // Extract lead status from response
        const leadStatus = apiResponse.properties?.hs_lead_status;

        if (!leadStatus) {
            return {
                statusCode: 404,
                message: 'Lead status not found for the given contact',
                data: null,
            };
        }

        console.log('Lead status retrieved successfully:', leadStatus);

        return {
            statusCode: 200,
            message: 'Lead status retrieved successfully',
            data: { leadStatus },
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

// Function to update the lead status (hs_lead_status) for a contact
async function updateLeadStatus(contactId, newLeadStatus) {
    try {
        // Validate inputs
        if (!contactId || !newLeadStatus) {
            return {
                statusCode: 400,
                message: 'Contact ID and new lead status are required',
                data: null,
            };
        }

        console.log(`Updating lead status for contact ID ${contactId} to ${newLeadStatus}`);

        // Define properties to update
        const properties = { hs_lead_status: newLeadStatus };
        const SimplePublicObjectInput = { properties };

        const apiResponse = await hubspotClient.crm.contacts.basicApi.update(
            contactId,
            SimplePublicObjectInput
        );

        console.log('Lead status updated successfully:', JSON.stringify(apiResponse, null, 2));

        return {
            statusCode: 200,
            message: 'Lead status updated successfully',
            data: apiResponse,
        };
    } catch (error) {
        console.error('Error updating lead status:', error.message);

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
//     const contactId = "71196564006"; // Replace with actual contact ID

//     const result = await getContactLeadStatus(contactId);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//         console.log('Lead Status:', result.data.leadStatus);
//     } else if (result.statusCode === 404) {
//         console.warn(result.message);
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();

module.exports = { getContactLeadStatus, updateLeadStatus };