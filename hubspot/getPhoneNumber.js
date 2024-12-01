require('dotenv').config();
const hubspot = require('@hubspot/api-client');

// Initialize HubSpot client with access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Function to get phone number by contact ID
async function getPhoneNumberByContactId(contactId) {
    const properties = ["phone"]; // Specify the property to retrieve

    try {
        // Fetch contact details from HubSpot
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(contactId, properties);

        if (apiResponse && apiResponse.properties) {
            const phone = apiResponse.properties.phone;
            console.log('Phone number retrieved:', phone);
            return {
                statusCode: 200,
                message: 'Phone number retrieved successfully',
                data: { phone },
            };
        } else {
            console.log('No phone number found for this contact');
            return {
                statusCode: 404,
                message: 'No phone number found for this contact',
                data: null,
            };
        }
    } catch (error) {
        console.error('Error retrieving phone number:', error.message);

        return {
            statusCode: error.response?.status || 500,
            message: error.response?.body?.message || 'An unknown error occurred',
            data: null,
        };
    }
}

// // Example usage function
// async function exampleUsage() {
//     const contactId = "71196564006"; // Replace with actual contact ID

//     try {
//         const result = await getPhoneNumberByContactId(contactId);

//         if (result.statusCode === 200) {
//             console.log(result.message);
//             console.log('Phone Number:', result.data.phone);
//         } else if (result.statusCode === 404) {
//             console.warn(result.message);
//         } else {
//             console.error(`Error (${result.statusCode}): ${result.message}`);
//         }
//     } catch (error) {
//         console.error('Unexpected error during example usage:', error);
//     }
// }

// // Execute the example usage function
// exampleUsage();

module.exports = { getPhoneNumberByContactId };