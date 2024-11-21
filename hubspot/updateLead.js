const { Client } = require("@hubspot/api-client");
require('dotenv').config();
const axios = require('axios');

async function updateLead(contactId, newLifecycleStage) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

  const data = {
    properties: {
      lifecyclestage: newLifecycleStage
    }
  };

  try {
    const response = await axios({
      method: 'patch',
      url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: data
    });

    console.log('Contact updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating contact:', error.response ? error.response.data : error.message);
    throw error;
  }
}




module.exports = { updateLead };

