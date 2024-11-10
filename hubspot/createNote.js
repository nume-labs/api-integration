const hubspot = require('@hubspot/api-client');
require('dotenv').config();

// Initialize the HubSpot client with your access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

async function createNote(noteData) {
    // Define the properties for the note, including hs_timestamp
    const properties = {
        "hs_note_body": noteData.body || "No content provided",  // Default message if no body is provided
        "hs_timestamp": new Date().toISOString()  // Set current timestamp in ISO format
    };

    try {
        // Create the note in HubSpot for the specified contact ID
        const apiResponse = await hubspotClient.crm.objects.notes.basicApi.create({
            properties
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

// Example usage of createNote function with dynamic input
const exampleNote = {
    body: "This is a dynamically created note.",
    contactId: "71196564006"  // Replace with actual contact ID
};

createNote(exampleNote);