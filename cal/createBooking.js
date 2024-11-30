require('dotenv').config();

// Environment variable for security
const API_KEY = process.env.CAL_API_KEY;

//TODO --> LISTEN TO WEBHOOK, TAKE IN ALL THE DETAILS, AND THEN CANCEL THAT BOOKING, AND CREATE A BOOKING FROM HERE WITH ALL THOSE DETAILS,
//THAT WAY I CAN GET THE BOOKING ID AND PASS IT TO HUBSPOT. 
// Function to construct the booking request body
function createBookingBody({ name, email, locationValue, locationOption, eventTypeId, start, end, timeZone, language }) {
    return {
        responses: {
            name,
            email,
            location: {
                optionValue: locationOption,
                value: locationValue,
            },
        },
        eventTypeId,
        start,
        end,
        timeZone,
        language,
        metadata: {},
    };
}

// Function to make the booking request
async function createBooking(bookingDetails) {
    try {
        // Validate inputs
        if (!API_KEY) {
            return {
                statusCode: 500,
                message: 'API key is missing. Please check your environment variables.',
                data: null,
            };
        }

        // Validate required booking details
        const requiredFields = ['name', 'email', 'locationValue', 'locationOption', 'eventTypeId', 'start', 'end', 'timeZone', 'language'];
        for (const field of requiredFields) {
            if (!bookingDetails[field]) {
                return {
                    statusCode: 400,
                    message: `Missing required booking detail: ${field}`,
                    data: null,
                };
            }
        }

        const url = `https://api.cal.com/v1/bookings?apiKey=${API_KEY}`;
        const body = createBookingBody(bookingDetails);

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        };

        // Make the API request
        const response = await fetch(url, options);

        if (!response.ok) {
            return {
                statusCode: response.status,
                message: `Failed to create booking. HTTP status: ${response.status}`,
                data: null,
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            message: 'Booking created successfully',
            data,
        };
    } catch (error) {
        console.error('Error creating booking:', error.message);

        return {
            statusCode: 500,
            message: error.message,
            data: null,
        };
    }
}

// // Example usage
(async () => {
    const bookingDetails = {
        name: "Faisal Test Wani V2",
        email: "fwani616@gmail.com",
        locationValue: "9717511173",
        locationOption: "phone",
        eventTypeId: 1365986,
        start: "2024-12-10T19:00:00.000Z",
        end: "2024-12-10T19:30:00.000Z",
        timeZone: "Asia/Kolkata",
        language: "English",
    };

    const result = await createBooking(bookingDetails);

    if (result.statusCode === 200) {
        console.log(result.message);
        console.log('Booking Details:', result.data);
    } else {
        console.error(`Error (${result.statusCode}): ${result.message}`);
    }
})();