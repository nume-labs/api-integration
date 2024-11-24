require('dotenv').config();

// Load environment variable for security
const API_KEY = process.env.CAL_API_KEY;

// Function to construct the booking update body
function createBookingUpdateBody({ title, startTime, endTime, status, description }) {
    return {
        title,
        startTime, // Adjusted key name
        endTime,   // Adjusted key name
        status,
        description,
    };
}

// Function to make the booking update request
async function updateBooking(bookingId, updateDetails) {
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
                message: 'Booking ID is required',
                data: null,
            };
        }

        // Validate required fields in updateDetails
        const requiredFields = ['title', 'startTime', 'endTime', 'status', 'description'];
        for (const field of requiredFields) {
            if (!updateDetails[field]) {
                return {
                    statusCode: 400,
                    message: `Missing required update detail: ${field}`,
                    data: null,
                };
            }
        }

        const url = `https://api.cal.com/v1/bookings/${bookingId}?apiKey=${API_KEY}`;
        const body = createBookingUpdateBody(updateDetails);

        console.log('Request Body:', JSON.stringify(body, null, 2)); // Log request body for debugging

        const options = {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        };

        // Make the API request
        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server Error:', errorData); // Log detailed server error

            return {
                statusCode: response.status,
                message: `Failed to update booking: ${errorData.message || 'Unknown error'}`,
                data: null,
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            message: 'Booking updated successfully',
            data,
        };
    } catch (error) {
        console.error('Error updating booking:', error.message);

        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

// Example usage
(async () => {
    const bookingId = 4520291; // Replace with actual booking ID
    const updateDetails = {
        title: "Updated Title",
        startTime: "2024-11-26T13:00:00.000Z", // Adjusted key name
        endTime: "2024-11-26T14:00:00.000Z",   // Adjusted key name
        status: "ACCEPTED",
        description: "Updated Description",
    };

    const result = await updateBooking(bookingId, updateDetails);

    if (result.statusCode === 200) {
        console.log(result.message);
        console.log('Updated Booking Details:', result.data);
    } else {
        console.error(`Error (${result.statusCode}): ${result.message}`);
    }
})();