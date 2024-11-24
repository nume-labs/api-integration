// const { Client } = require("@hubspot/api-client");
// require('dotenv').config();
// // Initialize the HubSpot client with your access token
// const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// // async function listNotes() {
// //     try {
// //         const limit = 10; // Define limit as needed
// //         const after = undefined; // Adjust if you need to paginate
// //         const properties = []; // Add any specific properties you want to retrieve
// //         const propertiesWithHistory = [];
// //         const associations = [];
// //         const archived = false;

// //         // Fetch notes using the HubSpot API
// //         const apiResponse = await hubspotClient.crm.objects.notes.basicApi.getPage(limit, after, properties, propertiesWithHistory, associations, archived);
        
// //         console.log("API Response:", apiResponse);
// //     } catch (error) {
// //         console.error("Error fetching notes:", error.message);
// //     }
// // }

// // Call the async function

// async function listNotes() {
//     try {
//         const limit = 10;
//         const apiResponse = await hubspotClient.crm.objects.notes.basicApi.getPage(limit);

//         apiResponse.results.forEach(note => {
//             console.log("Note ID:", note.id);
//             console.log("Created At:", note.createdAt);
//             console.log("Updated At:", note.updatedAt);
//             console.log("Archived:", note.archived);
//             console.log("body: ", note.body);
            
//             // Log each property of the note
//             console.log("Properties:");
//             for (const [key, value] of Object.entries(note.properties)) {
//                 console.log(`  ${key}: ${value}`);
//             }

//             console.log("--------------------------");
//         });
//     } catch (error) {
//         console.error("Error fetching notes:", error.response?.data || error.message);
//     }
// }

// listNotes();

