const hubspot = require('@hubspot/api-client');
require('dotenv').config();

async function getUserIdByPhone(phoneNumber) {
  const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
  const PublicObjectSearchRequest = { 
    query: phoneNumber,
    limit: 1,
  };

  try {
    const apiResponse = await hubspotClient.crm.contacts.searchApi.doSearch(PublicObjectSearchRequest);
    if (apiResponse.results && apiResponse.results.length > 0) {
      const userId = apiResponse.results[0].id;
      console.log("User ID:", userId);
      return userId;
    } else {
      console.log("No user found with this phone number");
      return null;
    }
  } catch (error) {
    console.error('Error fetching contact:', error.response ? error.response.body : error.message);
    throw error;
  }
}

// async function main() {
//   const userId = await getUserIdByPhone("705543726");
//   console.log("Returned User ID:", userId);
// }

// main();

module.exports = { getUserIdByPhone };