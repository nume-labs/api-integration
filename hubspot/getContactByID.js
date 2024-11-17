const hubspot = require('@hubspot/api-client');
require('dotenv').config();

const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

const properties = undefined;
const propertiesWithHistory = undefined;
const associations = undefined;
const archived = false;

async function getContactById(contactId) {
  try {
    const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(
      contactId,
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

// Call the async function with a specific contact ID
getContactById(71196564006); // Replace with the actual contact ID you want to retrieve
