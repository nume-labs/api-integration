require('dotenv').config();
const hubspot = require('@hubspot/api-client');
// Initialize the HubSpot client with your access token
const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// const contactId = "71196564006";
const properties = [
  "lifecycleStage"
];
const propertiesWithHistory = undefined;
const associations = undefined;
const archived = false;


async function getLeadStatus(contactId){
    try {
        const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(contactId, properties, propertiesWithHistory, associations, archived);
        // console.log(JSON.stringify(apiResponse.properties.lifecyclestage, null, 2));
        return apiResponse.properties.lifecyclestage;
      } catch (e) {
        e.message === 'HTTP request failed'
          ? console.error(JSON.stringify(e.response, null, 2))
          : console.error(e)
      }
}

async function main(contactId){
    const response = await getLeadStatus(contactId)
    console.log(response);
}

// main("71196564006");

module.exports = {
  getLeadStatus
}