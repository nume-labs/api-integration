// const hubspot = require('@hubspot/api-client');

// async function handleNoteCreation(message, phoneNumber) {
//     try {
//         // Get user ID
//         const response = await getUserIdByPhone(phoneNumber);
//         const userID = response.results?.[0]?.id;
//         if (!userID) {
//             console.warn(`No user found for phone number: ${phoneNumber}`);
//             return;
//         }

//         // Get current token
//         let token = await getToken();

//         // If no token or token is expired, start OAuth flow
//         if (!token || new Date(token.expires_at) <= new Date()) {
//             if (token && token.refresh_token) {
//                 // Refresh token
//                 token = await refreshToken(token.refresh_token);
//             } else {
//                 // If no refresh token, we need to re-authenticate
//                 console.error("No valid token. Please re-authenticate.");
//                 // Here you would typically redirect the user to the HubSpot OAuth URL
//                 return;
//             }
//             // Save new token
//             token.expires_at = new Date(Date.now() + token.expires_in * 1000).toISOString();
//             await saveToken(token);
//         }

//         // Initialize HubSpot client with the access token
//         const hubspotClient = new hubspot.Client({ accessToken: token.access_token });

//         // Create note
//         const notePayload = {
//             properties: {
//                 hs_note_body: message,
//                 hs_timestamp: new Date().toISOString()
//             },
//             associations: [
//                 {
//                     to: { id: userID },
//                     types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }]
//                 }
//             ]
//         };

//         const apiResponse = await hubspotClient.crm.objects.notes.basicApi.create(notePayload);
//         console.log(`Note created for userID: ${userID}`, JSON.stringify(apiResponse, null, 2));

//     } catch (error) {
//         console.error("Error in handleNoteCreation:", error);
//         throw error;
//     }
// }

// module.exports = {
//     handleNoteCreation
// }