document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataString = urlParams.get('data');
    const bookingData = JSON.parse(decodeURIComponent(dataString));

    const paidBtn = document.getElementById('paidBtn');
    const paymentSummary = document.getElementById('paymentSummary');

    function displayPaymentSummary() {
        let summaryHtml = '';

        if (bookingData.mode === 'hotel') {
            const peopleList = bookingData.people.map((p, i) => `
                <p class="ml-4 text-sm">- ${p.name}, Age: ${p.age}, Gender: ${p.gender}</p>
            `).join('');

            summaryHtml = `
                <h2 class="text-xl font-semibold mb-2">Booking Summary</h2>
                <p><strong>Hotel:</strong> ${bookingData.name}</p>
                <p><strong>Location:</strong> ${bookingData.location}</p>
                <p><strong>Check-in Date:</strong> ${bookingData.checkinDate}</p>
                <p><strong>Number of Nights:</strong> ${bookingData.numNights}</p>
                <p><strong>Total Price:</strong> <span class="text-green-600 font-bold">₹${bookingData.totalPrice.toFixed(2)}</span></p>
                <h3 class="font-medium mt-4">People:</h3>
                ${peopleList}
            `;
        } else { // It's a travel booking (flight, train, bus)
            const passengerList = bookingData.passengers.map((p, i) => `
                <p class="ml-4 text-sm">- ${p.name}, Age: ${p.age}</p>
            `).join('');

            summaryHtml = `
                <h2 class="text-xl font-semibold mb-2">Booking Summary</h2>
                <p><strong>Travel:</strong> ${bookingData.name} (${bookingData.mode})</p>
                <p><strong>Route:</strong> ${bookingData.from} to ${bookingData.to}</p>
                <p><strong>Date:</strong> ${bookingData.date}</p>
                <p><strong>Total Price:</strong> <span class="text-green-600 font-bold">₹${bookingData.totalPrice.toFixed(2)}</span></p>
                <h3 class="font-medium mt-4">Passengers:</h3>
                ${passengerList}
            `;
        }
        paymentSummary.innerHTML = summaryHtml;
    }

    // ... (rest of the script remains the same)
    displayPaymentSummary();


    // Expand/collapse payment options
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', (event) => {
            document.querySelectorAll('.payment-option div').forEach(div => div.classList.add('hidden'));
            event.currentTarget.querySelector('div').classList.remove('hidden');
        });
    });


    paidBtn.addEventListener('click', () => {
        const successUrl = `/travel/success/?data=${encodeURIComponent(dataString)}`;
        window.location.href = successUrl;
    });
});