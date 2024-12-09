require('dotenv').config();

// Environment variable for security
const API_KEY = process.env.CAL_API_KEY;

// Function to fetch booking details
async function getBookingIdByUid(bookingId) {
    try {
        // Validate API key
        if (!API_KEY) {
            return {
                statusCode: 500,
                message: 'API key is missing. Please check your environment variables.',
                data: null,
            };
        }

        // Validate booking ID
        if (!bookingId) {
            return {
                statusCode: 400,
                message: 'Booking ID is required.',
                data: null,
            };
        }

        const url = `https://api.cal.com/v2/bookings/${bookingId}`;
        const headers = {
            Authorization: `Bearer ${API_KEY}`,
            'cal-api-version': 'v2',
        };

        const options = {
            method: 'GET',
            headers,
        };

        // Make the API request
        const response = await fetch(url, options);

        if (!response.ok) {
            return {
                statusCode: response.status,
                message: `Failed to fetch booking details. HTTP status: ${response.statusText}`,
                data: null,
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            message: 'Booking details fetched successfully.',
            data,
        };
    } catch (error) {
        console.error(`[getBookingDetails] Error fetching booking details for ID: ${bookingId}`, error.message);

        return {
            statusCode: 500,
            message: error.message || 'An unexpected error occurred while fetching booking details.',
            data: null,
        };
    }
}

// // Example usage
// (async () => {
//     const bookingId = 'prB52hYwsKwD1oYEVc3GbQ';
//     const result = await getBookingIdByUid(bookingId);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//         console.log('Booking Details:', result.data);
//         console.log("ID only: ", result.data.data.id)
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();

module.exports = {
    getBookingIdByUid
}