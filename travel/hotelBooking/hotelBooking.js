document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataString = urlParams.get('data');
    const hotelData = JSON.parse(decodeURIComponent(dataString));

    const hotelInfo = document.getElementById('hotelInfo');
    const numNightsInput = document.getElementById('numNights');
    const numPeopleInput = document.getElementById('numPeople');
    const checkinDateInput = document.getElementById('checkinDate');
    const personFormsContainer = document.getElementById('personForms');
    const priceDetails = document.getElementById('priceDetails');
    const payNowBtn = document.getElementById('payNowBtn');

    let personInfo = [];

    function displayHotelInfo() {
        const amenitiesList = hotelData.amenities.map(amenity =>
            `<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">${amenity}</span>`
        ).join(' ');

        hotelInfo.innerHTML = `
            <div class="flex items-start space-x-4">
                <div class="text-4xl">${hotelData.image}</div>
                <div>
                    <h2 class="text-xl font-semibold">${hotelData.name}</h2>
                    <p class="text-sm text-gray-600">${hotelData.location}</p>
                    <div class="text-sm text-yellow-500">Rating: ${'★'.repeat(Math.floor(hotelData.rating))}</div>
                    <div class="mt-2 text-sm text-gray-700"><strong>Price per night:</strong> ₹${hotelData.price}</div>
                    <div class="mt-2"><strong>Amenities:</strong> ${amenitiesList}</div>
                </div>
            </div>
        `;
    }

    function generatePersonForms() {
        const numPeople = parseInt(numPeopleInput.value) || 1;
        personFormsContainer.innerHTML = '';
        personInfo = []; // Reset person data

        for (let i = 0; i < numPeople; i++) {
            const formCard = `
                <div class="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <h3 class="font-medium text-purple-800 mb-2">Person ${i + 1}</h3>
                    <div class="flex flex-col space-y-2">
                        <input type="text" placeholder="Full Name" class="p-2 border border-gray-300 rounded" oninput="updatePersonInfo(${i}, 'name', this.value)">
                        <div class="flex space-x-2">
                            <input type="number" placeholder="Age" class="w-24 p-2 border border-gray-300 rounded" oninput="updatePersonInfo(${i}, 'age', this.value)">
                            <select class="flex-1 p-2 border border-gray-300 rounded" onchange="updatePersonInfo(${i}, 'gender', this.value)">
                                <option value="" disabled selected>Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            personFormsContainer.innerHTML += formCard;
            personInfo.push({ name: '', age: '', gender: '' });
        }
        calculateTotalPrice();
    }

    // Global function to update person data
    window.updatePersonInfo = (index, key, value) => {
        personInfo[index][key] = value;
    };

    function calculateTotalPrice() {
        const numNights = parseInt(numNightsInput.value) || 1;
        const numPeople = parseInt(numPeopleInput.value) || 1;
        const total = hotelData.price * numNights * numPeople;
        priceDetails.innerHTML = `
            <p class="text-lg"><strong>Base Price:</strong> ₹${hotelData.price.toFixed(2)} per person per night</p>
            <p class="text-lg"><strong>Number of Nights:</strong> ${numNights}</p>
            <p class="text-lg"><strong>Number of People:</strong> ${numPeople}</p>
            <p class="text-xl font-bold mt-2">Total Price: ₹${total.toFixed(2)}</p>
        `;
    }

    function handlePayNow() {
        const allData = {
            mode: hotelData.mode,
            name: hotelData.name,
            price: hotelData.price,
            location: hotelData.location,
            checkinDate: checkinDateInput.value,
            numNights: parseInt(numNightsInput.value) || 1,
            people: personInfo,
            totalPrice: hotelData.price * (parseInt(numNightsInput.value) || 1) * (parseInt(numPeopleInput.value) || 1),
            // Add placeholders for travel-specific data
            from: null,
            to: null,
            date: null,
            passengers: null
        };
        const paymentUrl = `/travel/payment/?data=${encodeURIComponent(JSON.stringify(allData))}`;
        window.open(paymentUrl, '_blank');
    }

    numNightsInput.addEventListener('change', calculateTotalPrice);
    numPeopleInput.addEventListener('change', generatePersonForms);
    payNowBtn.addEventListener('click', handlePayNow);

    // Initial load
    displayHotelInfo();
    generatePersonForms();
});