const hubspot = require('@hubspot/api-client');
require('dotenv').config();



async function getContactLeadStatus(contactId) {
  const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

  const properties = ["hs_lead_status"];
  const propertiesWithHistory = undefined;
  const associations = undefined;
  const archived = false;

  try {
    const apiResponse = await hubspotClient.crm.contacts.basicApi.getById(contactId, properties, propertiesWithHistory, associations, archived);
    console.log(JSON.stringify(apiResponse, null, 2));
    return apiResponse.properties.hs_lead_status;
  } catch (e) {
    console.error('Error fetching contact:', e.message === 'HTTP request failed' ? JSON.stringify(e.response, null, 2) : e);
    throw e;
  }
}


async function updateLeadStatus(contactId, newLeadStatus) {
  const hubspotClient = new hubspot.Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });
  const properties = {
    hs_lead_status: newLeadStatus
  };
  const SimplePublicObjectInput = { properties };

  try {
    const apiResponse = await hubspotClient.crm.contacts.basicApi.update(contactId, SimplePublicObjectInput);
    console.log('Lead status updated successfully:', JSON.stringify(apiResponse, null, 2));
    return apiResponse;
  } catch (error) {
    console.error('Error updating lead status:', error.message);
    throw error;
  }
}

// async function main(){
//   updateLeadStatus(71196564006, "UNQUALIFIED");
// }
// main();

async function main(){
  const status = await getContactLeadStatus(71196564006);
  console.log(status);
}

main();


module.exports = { getContactLeadStatus, updateLeadStatus };