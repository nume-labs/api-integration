const hubspot = require('@hubspot/api-client');
require('dotenv').config();
// Initialize the HubSpot client with your access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

async function getUserByPhone(phoneNumber) {
  const PublicObjectSearchRequest = { 
    query: phoneNumber,
    limit: 1,
  };

  try {
    const apiResponse = await hubspotClient.crm.contacts.searchApi.doSearch(PublicObjectSearchRequest);
    return apiResponse;
  } catch (error) {
    console.error('Error fetching contact:', error.response ? error.response.body : error.message);
    throw error;
  }
}

async function getUserIdByPhone(phoneNumber, hubspotClient){
  const PublicObjectSearchRequest = { 
    query: phoneNumber,
    limit: 1,
  };

  try {
    const apiResponse = await hubspotClient.crm.contacts.searchApi.doSearch(PublicObjectSearchRequest);
    return apiResponse;
  } catch (error) {
    console.error('Error fetching contact:', error.response ? error.response.body : error.message);
    throw error;
  }
}

// // Example usage with .then()
// const phoneNumber = '36705543726';
// getUserByPhone(phoneNumber)
//   .then(response => {
//     console.log("This is the response: ", JSON.stringify(response, null, 2));
//   })
//   .catch(error => {
//     console.error("Error:", error);
//   });

// getUserIdByPhone(phoneNumber)
// .then(response => {
//   const userID = response.results?.[0]?.id;
//   console.log("This is the response: ", userID);
// })
// .catch(error => {
//   console.error("Error:", error);
// });


module.exports = {getUserIdByPhone, getUserByPhone}