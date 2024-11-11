const hubspot = require('@hubspot/api-client');
require('dotenv').config();

// Initialize the HubSpot client with your access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

async function createNoteWithAssociation(noteData) {
    // Define the properties for the note
    const notePayload = {
        properties: {
            hs_note_body: noteData.body || "No content provided",
            hs_timestamp: new Date(noteData.timestamp).toISOString()  // Set timestamp if provided
        },
        associations: [
            {
                to: {
                    id: noteData.contactId  // Contact ID to associate the note with
                },
                types: [
                    {
                        associationCategory: "HUBSPOT_DEFINED",
                        associationTypeId: 280  // Association type ID
                    }
                ]
            }
        ]
    };

    try {
        // Use HubSpot's API to create the note with association
        const apiResponse = await hubspotClient.apiRequest({
            method: 'POST',
            path: '/crm/v3/objects/notes',
            body: notePayload
        });

        // Log the response from HubSpot
        console.log("Note successfully created:", JSON.stringify(apiResponse, null, 2));
    } catch (e) {
        if (e.message === 'HTTP request failed') {
            console.error("Error:", JSON.stringify(e.response, null, 2));
        } else {
            console.error(e);
        }
    }
}

// Example usage of createNoteWithAssociation function with dynamic input
const exampleNote = {
    body: "This is a test note",
    timestamp: "2019-10-30T03:30:17.883Z",
    contactId: 71196564006  // Replace with the actual contact ID
};

createNoteWithAssociation(exampleNote);
