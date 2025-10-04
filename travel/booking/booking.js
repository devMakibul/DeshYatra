document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const name = urlParams.get('name');
    const price = parseFloat(urlParams.get('price'));
    const from = urlParams.get('from');
    const to = urlParams.get('to');
    const date = urlParams.get('date');

    const bookingInfo = document.getElementById('bookingInfo');
    const numPassengersInput = document.getElementById('numPassengers');
    const passengerFormsContainer = document.getElementById('passengerForms');
    const priceDetails = document.getElementById('priceDetails');
    const payNowBtn = document.getElementById('payNowBtn');

    let passengerInfo = [];

    function displayBookingInfo() {
        bookingInfo.innerHTML = `
            <h2 class="text-xl font-semibold mb-2">Travel Information</h2>
            <p><strong>Mode:</strong> ${mode.charAt(0).toUpperCase() + mode.slice(1)}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>From:</strong> ${from}</p>
            <p><strong>To:</strong> ${to}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Price per person:</strong> ₹${price}</p>
        `;
    }

    function generatePassengerForms() {
        const numPassengers = parseInt(numPassengersInput.value) || 1;
        passengerFormsContainer.innerHTML = '';
        passengerInfo = []; // Reset passenger data

        for (let i = 0; i < numPassengers; i++) {
            const formCard = `
                <div class="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 class="font-medium text-blue-800 mb-2">Passenger ${i + 1}</h3>
                    <div class="flex space-x-4 mb-2">
                        <input type="text" placeholder="Full Name" class="flex-1 p-2 border border-gray-300 rounded" oninput="updatePassengerInfo(${i}, 'name', this.value)">
                        <input type="number" placeholder="Age" class="w-24 p-2 border border-gray-300 rounded" oninput="updatePassengerInfo(${i}, 'age', this.value)">
                    </div>
                </div>
            `;
            passengerFormsContainer.innerHTML += formCard;
            passengerInfo.push({ name: '', age: '' });
        }
        calculateTotalPrice();
    }

    // Global function to update passenger data, called by oninput
    window.updatePassengerInfo = (index, key, value) => {
        passengerInfo[index][key] = value;
    };

    function calculateTotalPrice() {
        const numPassengers = parseInt(numPassengersInput.value) || 1;
        const total = price * numPassengers;
        priceDetails.innerHTML = `
            <p class="text-lg"><strong>Base Price:</strong> ₹${price.toFixed(2)} x ${numPassengers} passenger(s)</p>
            <p class="text-lg font-bold">Total Price: ₹${total.toFixed(2)}</p>
        `;
    }

    function handlePayNow() {
        const allData = {
            mode,
            name,
            price,
            from,
            to,
            date,
            passengers: passengerInfo,
            totalPrice: price * (parseInt(numPassengersInput.value) || 1),
            // Add placeholders for hotel-specific data to ensure consistency
            location: null,
            checkinDate: null,
            numNights: null,
            people: null
        };
        const paymentUrl = `/travel/payment/?data=${encodeURIComponent(JSON.stringify(allData))}`;
        window.open(paymentUrl, '_blank');
    }

    numPassengersInput.addEventListener('change', generatePassengerForms);
    payNowBtn.addEventListener('click', handlePayNow);

    // Initial load
    displayBookingInfo();
    generatePassengerForms();
});