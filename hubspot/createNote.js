// require('dotenv').config();
// const hubspot = require('@hubspot/api-client');
// // Initialize the HubSpot client with your access token
// // const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
// async function createNote(body, contactID, hubspotClient) {
//     // Define the properties for the note
//     const notePayload = {
//         properties: {
//             hs_note_body: body || "No content provided",
//             hs_timestamp: new Date().toISOString()  // Set timestamp to now
//         },
//         associations: [
//             {
//                 to: {
//                     id: 71196564006  //contactID  // Contact ID to associate the note with
//                 },
//                 types: [
//                     {
//                         associationCategory: "HUBSPOT_DEFINED",
//                         associationTypeId: 202  // Association type ID should be 202 (note to contact or contact to note)
//                     }
//                 ]
//             }
//         ]
//     };

//     try {
//         // Use HubSpot's API to create the note with association
//         const apiResponse = await hubspotClient.apiRequest({
//             method: 'POST',
//             path: '/crm/v3/objects/notes',
//             body: notePayload
//         });

//         // Log the response from HubSpot
//         console.log("Note successfully created:", JSON.stringify(apiResponse, null, 2));
//     } catch (e) {
//         if (e.message === 'HTTP request failed') {
//             console.error("Error:", JSON.stringify(e.response, null, 2));
//         } else {
//             console.error(e);
//         }
//     }
// }

// // Example usage of createNoteWithAssociation function with dynamic input
// const exampleNote = {
//     body: "This is the final final test note",
//     timestamp: "2020-10-30T03:30:17.883Z",
//     contactId: 71196564006  // Replace with the actual contact ID
// };

// // createNote(exampleNote.body, exampleNote.contactId, hubspotClient);


// module.exports = createNote

require('dotenv').config();
const hubspot = require('@hubspot/api-client');

async function createNote(body, contactID, hubspotClient) {
    // Define the properties for the note
    const notePayload = {
        properties: {
            hs_note_body: body || "No content provided",
            hs_timestamp: new Date().toISOString()  // Set timestamp to now
        },
        associations: [
            {
                to: {
                    // id: contactID.toString()  // Ensure contactID is a string
                    id: 71196564006  // example contact id
                },
                types: [
                    {
                        associationCategory: "HUBSPOT_DEFINED",
                        associationTypeId: 202  // Association type ID for note to contact
                    }
                ]
            }
        ]
    };

    try {
        // Use HubSpot's API to create the note with association
        const apiResponse = await hubspotClient.crm.objects.notes.basicApi.create(notePayload);

        console.log("Note successfully created:", JSON.stringify(apiResponse, null, 2));
        return apiResponse;
    } catch (error) {
        console.error("Error creating note:", error.message);
        if (error.response) {
            console.error("Response data:", JSON.stringify(error.response.data, null, 2));
        }
        throw error; // Re-throw the error for the caller to handle
    }
}

module.exports = createNote;