require('dotenv').config();
const hubspot = require('@hubspot/api-client');

// Initialize HubSpot client with access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Function to create a meeting in HubSpot
async function createHubSpotMeeting({ startTime, endTime, externalUrl, body, ownerId, bookingUID, contactId }) {
    const meetingProperties = {
        hs_timestamp: new Date().toISOString(),
        hubspot_owner_id: ownerId,
        hs_meeting_title: "New Booking Meeting",
        hs_meeting_body: body,
        hs_internal_meeting_notes: bookingUID, // Only the booking UID in internal notes
        hs_meeting_external_url: externalUrl || "",
        hs_meeting_location: "Remote",
        hs_meeting_start_time: startTime,
        hs_meeting_end_time: endTime,
        hs_meeting_outcome: "SCHEDULED"
    };

    const meetingInput = {
        properties: meetingProperties,
        associations: [
            {
                to: { id: contactId}, // TODO--> Adjust this ID as needed
                types: [
                    {
                        associationCategory: "HUBSPOT_DEFINED",
                        associationTypeId: 200
                    }
                ]
            }
        ]
    };

    try {
        const apiResponse = await hubspotClient.crm.objects.meetings.basicApi.create(meetingInput);
        console.log('Meeting created successfully:', JSON.stringify(apiResponse, null, 2));
        return { statusCode: 200, message: 'Meeting created successfully', data: apiResponse };
    } catch (error) {
        if (error.message === 'HTTP request failed') {
            console.error('Error response from HubSpot API:', JSON.stringify(error.response, null, 2));
            return { statusCode: error.response?.status || 500, message: 'Error response from HubSpot API', data: error.response };
        } else {
            console.error('Unexpected error:', error);
            return { statusCode: 500, message: 'Unexpected error occurred', data: null };
        }
    }
}


module.exports = {
    createHubSpotMeeting
};

// // Example usage function
// async function exampleUsage() {
//     // Sample data for creating a meeting
//     const meetingData = {
//         startTime: "2024-12-01T10:00:00.000Z",  // Example start time
//         endTime: "2024-12-01T11:00:00.000Z",    // Example end time
//         externalUrl: "https://example.com/meeting-url",  // Example external URL
//         body: "final sample v4.",  // Example meeting body
//         ownerId: process.env.CAL_HUBSPOT_OWNER_ID,  // Owner ID from environment variables
//         bookingUID: "5Jop1BNjpfYVWhit5amdasdasdffasdx2",  // Booking UID to be included in internal notes
//         contactID : "71196564006"
//     };

//     try {
//         const result = await createHubSpotMeeting(meetingData);
        
//         if (result.statusCode === 200) {
//             console.log(result.message);
//         } else {
//             console.error(`Error (${result.statusCode}): ${result.message}`);
//         }
//     } catch (error) {
//         console.error('Unexpected error during example usage:', error);
//     }
// }

// // Execute the example usage function
// exampleUsage();