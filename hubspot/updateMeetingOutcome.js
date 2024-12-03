require('dotenv').config();
const hubspot = require('@hubspot/api-client');
// Initialize HubSpot client with access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// Function to update the meeting outcome in HubSpot
async function updateMeetingOutcome(meetingId, outcome) {
    const properties = {
        hs_meeting_outcome: outcome
    };
    const SimplePublicObjectInput = { properties };

    try {
        const apiResponse = await hubspotClient.crm.objects.meetings.basicApi.update(meetingId, SimplePublicObjectInput);
        console.log('Meeting outcome updated successfully:', JSON.stringify(apiResponse, null, 2));
        return { statusCode: 200, message: 'Meeting outcome updated successfully', data: apiResponse };
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

module.exports = {updateMeetingOutcome}

// Example usage
// (async () => {
//     const meetingId = "65840863285"; // Replace with actual meeting ID
//     const outcome = "CANCELED"; // Replace with desired outcome

//     const result = await updateMeetingOutcome(meetingId, outcome);
//     console.log(result.message);
// })();