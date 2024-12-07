require('dotenv').config();
const axios = require('axios');

// Environment variable for security
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Function to get meetings associated with a specific contact ID and return full meeting data
async function getMeetingsByContactID(contactId) {
    if (!HUBSPOT_ACCESS_TOKEN) {
        return {
            statusCode: 500,
            message: 'Access token is missing. Please check your environment variables.',
            data: null,
        };
    }

    const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/meetings`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
            },
        });

        if (response.status !== 200) {
            return {
                statusCode: response.status,
                message: `Failed to fetch meetings for contact. HTTP status: ${response.status}`,
                data: null,
            };
        }

        const meetingIds = response.data.results.map(meeting => meeting.id);
        console.log(`Meetings associated with contact ID "${contactId}" fetched successfully. Count:`, meetingIds.length);

        // Fetch full meeting details for each meeting ID, including specific properties
        const meetings = await Promise.all(meetingIds.map(async (meetingId) => {
            const meetingUrl = `https://api.hubapi.com/crm/v3/objects/meetings/${meetingId}?properties=hs_meeting_outcome,hs_lastmodifieddate,hs_internal_meeting_notes`;
            const meetingResponse = await axios.get(meetingUrl, {
                headers: {
                    Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                },
            });
            return meetingResponse.data;
        }));

        return {
            statusCode: 200,
            message: `Meetings associated with contact ID "${contactId}" fetched successfully`,
            data: meetings,
        };
    } catch (error) {
        console.error('Error fetching meetings for contact:', error.message);
        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

// Function to filter meetings by outcome
function filterMeetingsByOutcome(meetings, outcome) {
    return meetings.filter(meeting => 
        meeting.properties.hs_meeting_outcome === outcome
    );
}

// Main function to get and filter meetings by contact ID and outcome
async function getMeetingsByContactIDAndOutcome(contactId, outcome) {
    const response = await getMeetingsByContactID(contactId);

    if (response && response.statusCode === 200) {
        const filteredMeetings = filterMeetingsByOutcome(response.data, outcome);
        
        if (filteredMeetings.length > 0) {
            console.log('Filtered Meetings:', JSON.stringify(filteredMeetings, null, 2));
            return { statusCode: 200, message: 'Scheduled meetings found', data: filteredMeetings };
        } else {
            console.log('No scheduled meetings found for the specified contact ID.');
            return { statusCode: 404, message: 'No scheduled meetings found for the specified contact ID', data: [] };
        }
    } else {
        console.error(`Error (${response?.statusCode || 'undefined'}): ${response?.message || 'An unknown error occurred.'}`);
        return response;
    }
}

// Function to get the latest meeting from a list of meetings
function getLatestMeeting(meetings) {
    if (meetings.length === 0) {
        return null;
    }

    // Sort meetings by last modified date in descending order
    meetings.sort((a, b) => new Date(b.properties.hs_lastmodifieddate) - new Date(a.properties.hs_lastmodifieddate));

    // Return the first meeting in the sorted array (the latest one)
    return meetings[0];
}

// Function to get the latest scheduled meeting for a contact
async function getLatestScheduledMeeting(contactId, outcome) {
    const result = await getMeetingsByContactIDAndOutcome(contactId, outcome);

    if (result.statusCode === 200 && result.data.length > 0) {
        const latestMeeting = getLatestMeeting(result.data);
        
        // Extract and clean bookingUID from internal notes
        const rawBookingUID = latestMeeting.properties.hs_internal_meeting_notes;
        const bookingUID = stripHtmlTags(rawBookingUID);
        
        console.log('Latest Scheduled Meeting:', JSON.stringify(latestMeeting, null, 2));
        console.log('Clean Booking UID:', bookingUID);
        
        return { statusCode: 200, message: 'Latest scheduled meeting found', data: latestMeeting, bookingUID };
    } else {
        console.error(`Error (${result.statusCode}): ${result.message}`);
        return { statusCode: 404, message: 'No scheduled meetings found for the specified contact ID', data: null };
    }
}

function stripHtmlTags(input) {
    return input.replace(/<\/?[^>]+(>|$)/g, "");
}

// // Example usage function
// async function exampleUsage() {
//     const contactId = "120216225015"; // Replace with the actual HubSpot contact ID
//     const outcome = "SCHEDULED"; // Desired meeting outcome

//     try {
//         const result = await getLatestScheduledMeeting(contactId, outcome);
        
//         if (result.statusCode === 200) {
//             console.log(result.message);
//             console.log('Latest Scheduled Meeting:', JSON.stringify(result.data, null, 2));
//             console.log('Booking UID:', result.bookingUID);
//         } else {
//             console.error(`Error (${result.statusCode}): ${result.message}`);
//         }
//     } catch (error) {
//         console.error('Unexpected error during example usage:', error);
//     }
// }

// // Execute the example usage function
// exampleUsage();

module.exports = {
    getMeetingsByContactIDAndOutcome,
    getLatestScheduledMeeting
};