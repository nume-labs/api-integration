require('dotenv').config();
const hubspot = require('@hubspot/api-client');

// Function to create a note and associate it with a contact
async function createNote(body, contactID, hubspotClient) {
    try {
        // Validate inputs
        if (!hubspotClient) {
            return {
                statusCode: 500,
                message: 'HubSpot client is not initialized',
                data: null,
            };
        }

        if (!contactID) {
            return {
                statusCode: 400,
                message: 'Contact ID is required',
                data: null,
            };
        }

        // Define the properties for the note
        const notePayload = {
            properties: {
                hs_note_body: body || "No content provided",
                hs_timestamp: new Date().toISOString(), // Set timestamp to now
            },
            associations: [
                {
                    to: {
                        id: contactID.toString(), // Ensure contactID is a string
                    },
                    types: [
                        {
                            associationCategory: "HUBSPOT_DEFINED",
                            associationTypeId: 202, // Association type ID for note to contact
                        },
                    ],
                },
            ],
        };

        // console.log("Creating note with payload:", JSON.stringify(notePayload, null, 2)); // Debugging

        // Use HubSpot's API to create the note with association
        const apiResponse = await hubspotClient.crm.objects.notes.basicApi.create(notePayload);

        // console.log("Note successfully created:", JSON.stringify(apiResponse, null, 2));
        return {
            statusCode: 200,
            message: 'Note successfully created',
            data: apiResponse,
        };
    } catch (error) {
        console.error("Error creating note:", error.message);

        if (error.response) {
            console.error("Response data:", JSON.stringify(error.response.data, null, 2));
        }

        return {
            statusCode: error.response?.status || 500,
            message: error.message || "An unknown error occurred",
            data: null,
        };
    }
}

// const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// (async () => {
//     const body = "This is a test note.";
//     const contactID = 71196564006; // Replace with actual contact ID

//     const result = await createNote(body, contactID, hubspotClient);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//         console.log('Created Note Details:', result.data);
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();

module.exports = createNote;