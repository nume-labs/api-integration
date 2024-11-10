const { Client } = require("@hubspot/api-client");
require('dotenv').config();

// Initialize the HubSpot client with your access token
const hubspotClient = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Function to post a note to a contact given their ID
async function postNoteToContact(contactId, noteContent) {
    try {
        // Create the note
        const noteResponse = await hubspotClient.crm.notes.basicApi.create({
            properties: {
                hs_note_body: noteContent
            }
        });

        // Extract the note ID from the response
        const noteId = noteResponse.body.id;
        console.log(`Note created with ID: ${noteId}`);

        // Associate the note with the contact
        await hubspotClient.crm.notes.associationsApi.create(
            noteId,  // The note ID
            'contacts',  // The object type to associate with (contacts)
            contactId,  // The contact ID
            'note_to_contact'  // The association type
        );

        console.log(`Note successfully associated with contact ID: ${contactId}`);
    } catch (error) {
        // Handle any errors that occur during the request
        console.error("Error occurred while posting a note:", error.message);
    }
}

// Example Usage: Post a note to a contact
const contactId = '70087149061';  // Replace with the actual contact ID
const noteContent = "This is a sample note for the contact.";
postNoteToContact(contactId, noteContent);
