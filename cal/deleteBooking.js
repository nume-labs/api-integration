require('dotenv').config();
// Load environment variable for the API key
const API_KEY = process.env.CAL_API_KEY;

// Function to cancel a booking by ID
async function deleteBooking(bookingId) {
    try {
        // Validate input
        if (!API_KEY) {
            return {
                statusCode: 500,
                message: 'API key is missing. Please check your environment variables.',
                data: null,
            };
        }

        if (!bookingId) {
            return {
                statusCode: 400,
                message: 'Booking ID is required',
                data: null,
            };
        }

        const url = `https://api.cal.com/v1/bookings/${bookingId}/cancel?apiKey=${API_KEY}`;
        const options = { method: 'DELETE' };

        // Make the API request
        const response = await fetch(url, options);

        // Handle non-OK responses
        if (!response.ok) {
            return {
                statusCode: response.status,
                message: `Failed to cancel booking. HTTP status: ${response.status}`,
                data: null,
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            message: 'Booking canceled successfully',
            data,
        };
    } catch (error) {
        console.error('Error canceling booking:', error.message);

        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

// // Example usage
// (async () => {
//     const bookingId = '4520898'; // Replace with the specific booking ID

//     const result = await deleteBooking(bookingId);

//     if (result.statusCode === 200) {
//         console.log(result.message);
//         console.log('Canceled Booking Details:', result.data);
//     } else {
//         console.error(`Error (${result.statusCode}): ${result.message}`);
//     }
// })();