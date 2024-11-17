// Load environment variable for the API key
const API_KEY = process.env.API_KEY;

// Function to get booking details by ID
async function getBooking(bookingId) {
  const url = `https://api.cal.com/v1/bookings/${bookingId}?apiKey=${API_KEY}`;

  const options = { method: 'GET' };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    return error;
  }
}

module.exports = getBooking;


function decideReminder(bookingId){
    //get the booking details 
    const response = getBooking(bookingId);
    
    //check the metadata to see which reminder to send 
    const reminderStatus = response.metadata.reminderStatus; 

    //indicates 24 hour reminder to be sent
    if(reminderStatus === 1){
        return 24;
    }
    //indicates 12 hour reminder to be sent
    else if(reminderStatus === 2){
        return 12;
    }
    //indicates 1 hour reminder to be sent
    else if(reminderStatus === 3){
        return 1;
    }
    //indicates all reminders have been sent
    else if(reminderStatus ===4){
        return 0;
    }
    //indicated error, note should be made and flagged to a team member.
    else{
        return 404;
    }
}


function updateReminder(bookingId){
    //get the reminder status from the booking details
    const response = getBooking(bookingId);
    
    //check the metadata to see which reminder to send 
    const reminderStatus = response.metadata.reminderStatus;
    reminderStatus +=1; 
    //update the reminder status in the booking details

    
    
}

async function patchBooking(body){
    
    const options = {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: '{"title":"Debugging between Syed Ali Shahbaz and Hello Hello","start":"2023-05-24T13:00:00.000Z","end":"2023-05-24T13:30:00.000Z","status":"CANCELLED"}'
      };
      
      fetch('https://api.cal.com/v1/bookings/{id}?apiKey=cal_live_15f39c875bca2181ac780c9bb1e2843a', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}

// Example usage
// getBooking('100'); // Pass the specific booking ID here
