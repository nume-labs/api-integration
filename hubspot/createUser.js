require('dotenv').config();
const axios = require('axios');

// Environment variable for security
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;

// Function to create a new user in HubSpot
async function createHubSpotUser(email) {
    if (!HUBSPOT_ACCESS_TOKEN) {
        return {
            statusCode: 500,
            message: 'Access token is missing. Please check your environment variables.',
            data: null,
        };
    }

    const url = 'https://api.hubapi.com/settings/v3/users/';
    const body = {
        email: email,
    };

    try {
        const response = await axios.post(url, body, {
            headers: {
                Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 201) {
            console.log('User created successfully:', response.data);
            return { statusCode: 201, message: 'User created successfully', data: response.data };
        } else {
            return {
                statusCode: response.status,
                message: `Failed to create user. HTTP status: ${response.status}`,
                data: null,
            };
        }
    } catch (error) {
        console.error('Error creating user:', error.response?.data || error.message);
        return {
            statusCode: error.response?.status || 500,
            message: error.response?.data?.message || 'Unexpected error occurred',
            data: null,
        };
    }
}

// // Example usage function
// async function exampleUsage() {
//     const email = 'newuser@example.com'; // Replace with the user's email address

//     try {
//         const result = await createHubSpotUser(email);

//         if (result.statusCode === 201) {
//             console.log(result.message);
//             console.log('Created User Details:', JSON.stringify(result.data, null, 2));
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
    createHubSpotUser,
};