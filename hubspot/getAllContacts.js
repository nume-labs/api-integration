const hubspot = require('@hubspot/api-client');
require('dotenv').config();

const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

async function getContactsPage(limit, after, properties, propertiesWithHistory, associations, archived) {
  try {
    const apiResponse = await hubspotClient.crm.contacts.basicApi.getPage(
      limit,
      after,
      properties,
      propertiesWithHistory,
      associations,
      archived
    );
    console.log(JSON.stringify(apiResponse, null, 2));
  } catch (e) {
    if (e.message === 'HTTP request failed') {
      console.error(JSON.stringify(e.response, null, 2));
    } else {
      console.error(e);
    }
  }
}

// Call the async function with specific parameters
getContactsPage(10, undefined, undefined, undefined, undefined, false); // Adjust arguments as needed
