const hubspot = require('@hubspot/api-client');
require('dotenv').config();

// Initialize the HubSpot client with your access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

/**
 * Function to retrieve all contacts from HubSpot and find a contact by phone number.
 * @param {string} phoneNumber - The phone number to search for.
 * @returns {Object|null} - The matched contact object or null if not found.
 */
async function getContactByPhoneNumber(phoneNumber) {
    try {
        // Fetch all contacts from HubSpot
        const response = await hubspotClient.crm.contacts.basicApi.getPage(100); // Fetch 100 contacts per page
        const contacts = response.body.results;

        // Iterate through each contact to find a match by phone number
        for (const contact of contacts) {
            const contactPhoneNumber = contact.properties.phone || contact.properties.mobilephone;
            
            // Check if the phone number matches (normalize both numbers for comparison)
            if (contactPhoneNumber && normalizePhoneNumber(contactPhoneNumber) === normalizePhoneNumber(phoneNumber)) {
                return contact;  // Return the matched contact
            }
        }

        // If no match is found, return null
        return null;
    } catch (error) {
        console.error("Error fetching contacts:", error);
        throw error;
    }
}

/**
 * Helper function to normalize phone numbers for comparison.
 * This removes spaces, dashes, and parentheses to ensure consistent comparison.
 * @param {string} phoneNumber - The phone number to normalize.
 * @returns {string} - The normalized phone number.
 */
function normalizePhoneNumber(phoneNumber) {
    return phoneNumber.replace(/[-\s()]/g, '');  // Remove dashes, spaces, and parentheses
}

// Example usage of getContactByPhoneNumber function
(async () => {
    const phoneNumberToSearch = "36705543726";  // Replace with actual phone number
    const contact = await getContactByPhoneNumber(phoneNumberToSearch);

    if (contact) {
        console.log("Contact found:", JSON.stringify(contact, null, 2));
    } else {
        console.log("No contact found with that phone number.");
    }
})();