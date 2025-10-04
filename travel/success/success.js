document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataString = urlParams.get('data');
    const bookingData = JSON.parse(decodeURIComponent(dataString));

    const downloadTicketBtn = document.getElementById('downloadTicketBtn');

   function generateTicketContent() {
        let content = `--- TICKET ---\n\n`;
        content += `Booking Confirmed!\n\n`;

        if (bookingData.mode === 'hotel') {
            content += `Hotel Info:\n`;
            content += `Hotel Name: ${bookingData.name}\n`;
            content += `Location: ${bookingData.location}\n`;
            content += `Check-in Date: ${bookingData.checkinDate}\n`;
            content += `Number of Nights: ${bookingData.numNights}\n\n`;
            content += `Guests:\n`;
            bookingData.people.forEach((p, i) => {
                content += `${i + 1}. ${p.name}, Age: ${p.age}, Gender: ${p.gender}\n`;
            });
        } else { // It's a travel booking (flight, train, bus)
            content += `Travel Info:\n`;
            content += `Mode: ${bookingData.mode.charAt(0).toUpperCase() + bookingData.mode.slice(1)}\n`;
            content += `Name: ${bookingData.name}\n`;
            content += `Route: ${bookingData.from} to ${bookingData.to}\n`;
            content += `Date: ${bookingData.date}\n\n`;
            content += `Passengers:\n`;
            // Check if passengers is not null before using forEach
            if (bookingData.passengers) {
                bookingData.passengers.forEach((p, i) => {
                    content += `${i + 1}. ${p.name}, Age: ${p.age}\n`;
                });
            }
        }
        content += `\nTotal Price: ₹${bookingData.totalPrice.toFixed(2)}\n\n`;
        content += `Thank you for booking with us!`;
        
        return content;
    }

    downloadTicketBtn.addEventListener('click', () => {
        const ticketContent = generateTicketContent();
        const blob = new Blob([ticketContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'booking_ticket.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});