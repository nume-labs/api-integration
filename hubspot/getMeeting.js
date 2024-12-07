require('dotenv').config();
const axios = require('axios');
const {getMeetingsByContactIDAndOutcome} = require('../hubspot/getMeetingByOutcome')

// Environment variable for security
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Function to construct the search request body
// function createSearchBody() {
//     return {
//         filterGroups: [], // No filters to get all meetings
//         properties: [
//             'hs_internal_meeting_notes' // Include internal notes for UID search
//         ],
//         limit: 100 // Increase limit if necessary
//     };
// }

async function getMeetingsForContact(userId, outcome){
    const response = await getMeetingsByContactIDAndOutcome(userId, outcome); 
    console.log("getting meetings for specific contact and outcome...")
    if(response.statusCode === 200){
        console.log("response successful");
        return response;
    }else{
        console.error("error: ", response.message); 
        return response
    }
}


// // Function to search for all meetings
// async function searchAllMeetings() {
//     if (!HUBSPOT_ACCESS_TOKEN) {
//         return {
//             statusCode: 500,
//             message: 'Access token is missing. Please check your environment variables.',
//             data: null,
//         };
//     }

//     const url = 'https://api.hubapi.com/crm/v3/objects/meetings/search';
//     const body = createSearchBody();

//     const options = {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
//         },
//         data: body,
//         url,
//     };

//     try {
//         const response = await axios(options);

//         if (response.status !== 200) {
//             return {
//                 statusCode: response.status,
//                 message: `Failed to fetch meetings. HTTP status: ${response.status}`,
//                 data: null,
//             };
//         }

//         const meetings = response.data.results;
//         console.log('Meetings fetched successfully:', meetings.length);
        
//         return {
//             statusCode: 200,
//             message: 'Meetings fetched successfully',
//             data: meetings,
//         };
//     } catch (error) {
//         console.error('Error fetching meetings:', error.message);
//         return {
//             statusCode: 500,
//             message: error.message,
//             data: null,
//         };
//     }
// }

// Function to filter meetings by booking UID in internal notes
function filterMeetingsByBookingUID(meetings, bookingUID) {
    return meetings.filter(meeting =>
        meeting.properties.hs_internal_meeting_notes &&
        meeting.properties.hs_internal_meeting_notes.includes(bookingUID)
    );
}

// Main function to get and filter meetings by booking UID
async function getMeetingsByBookingContactOutcome(contactId, bookingUID, outcome) {
    const response = await getMeetingsForContact(contactId, outcome);

    if (response && response.statusCode === 200) {
        const filteredMeetings = filterMeetingsByBookingUID(response.data, bookingUID);
        
        if (filteredMeetings.length > 0) {
            // console.log('Filtered Meetings:', JSON.stringify(filteredMeetings, null, 2));
            return { statusCode: 200, message: 'Meetings found', data: filteredMeetings };
        } else {
            console.log('No meetings found with the specified booking UID.');
            return { statusCode: 404, message: 'No meetings found with the specified booking UID', data: [] };
        }
    } else {
        console.error(`Error (${response?.statusCode || 'undefined'}): ${response?.message || 'An unknown error occurred.'}`);
        return response;
    }
}


//// Example usage function
// async function exampleUsage() {
//     const bookingUID = "1t6v682wd3WLRTMgCUzjGp"; // Example booking UID
//     const outcome = "SCHEDULED"; 
//     const contactId = "120216225015"; // Example contact ID

//     try {
//         const result = await getMeetingsByBookingUID(contactId, bookingUID, outcome);
        
//         if (result.statusCode === 200) {
//             console.log(result.message);
//             console.log('Filtered Meetings:', JSON.stringify(result.data, null, 2));
//             console.log("meeting id: ", result.data[0].id)
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
    getMeetingsByBookingContactOutcome
};