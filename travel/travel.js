function showLoading(input) {
  input.parentNode.classList.add('loading');
}

function hideLoading(input) {
  input.parentNode.classList.remove('loading');
}

function initAutocomplete() {
  const boardingInput = document.getElementById('fromInput');
  const destinationInput = document.getElementById('toInput');

  const boardingAutocomplete = new google.maps.places.Autocomplete(boardingInput);
  const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);

  boardingInput.addEventListener('input', () => {
    showLoading(boardingInput);
  });
  boardingAutocomplete.addListener('place_changed', () => {
    hideLoading(boardingInput);
  });

  destinationInput.addEventListener('input', () => {
    showLoading(destinationInput);
  });
  destinationAutocomplete.addListener('place_changed', () => {
    hideLoading(destinationInput);
  });
}


// Attach the initialization function to the window load event
window.addEventListener('load', initAutocomplete);

let mockData = null; // Declare a global variable to hold the data


function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active');
  });

  // Show selected tab content
  document.getElementById(tabName).classList.add('active');

  // Add active class to clicked button
  event.target.classList.add('active');
}



document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date to today
    document.getElementById('dateInput').min = new Date().toISOString().split('T')[0];

    // Set initial values from URL parameters
    const params = new URLSearchParams(location.search);
    const boardParam = params.get('board');
    const destParam = params.get('dest');
    const dateParam = params.get('date');

    // Check if all three parameters exist before setting values and searching
    if (boardParam && destParam && dateParam) {
        document.getElementById('fromInput').value = boardParam;
        document.getElementById('toInput').value = destParam;
        document.getElementById('dateInput').value = dateParam;

        searchTransport();
    } else {
        // Optional: You can set default values here if the parameters are missing
        document.getElementById('fromInput').value = 'Board';
        document.getElementById('toInput').value = 'Destination';
        document.getElementById('dateInput').value = new Date().toISOString().split('T')[0];
    }
});

let map;
let currentMapLayer = 'street';

// New asynchronous function to load data from the JSON file
async function loadData() {
    if (mockData) {
        return; // Data is already loaded
    }
    try {
        const response = await fetch('/js/mockData.json');
        mockData = await response.json();
    } catch (error) {
        console.error('Error fetching mock data:', error);
        alert('Failed to load travel data. Please try again.');
    }
}

async function searchTransport() {
    const from = document.getElementById('fromInput').value;
    const to = document.getElementById('toInput').value;
    const date = document.getElementById('dateInput').value;

    if (!from || !to || !date) {
        alert('Please fill in all fields');
        return;
    }

    // Await data loading before proceeding
    await loadData();
    if (!mockData) {
        return; // Stop if data loading failed
    }

    // Show results section
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });

    // Populate results
    populateFlights(from, to, date);
    populateTrains(from, to, date);
    populateBuses(from, to, date);
    populateHotels(to);
    populateTouristPlaces(to);
    initializeMap(to);
    fetch10DayWeather(to, date);
}

async function fetch10DayWeather(destination, date) {
    const weatherSection = document.getElementById('weatherSection');
    const weatherInfo = document.getElementById('weatherInfo');

    weatherSection.classList.remove('hidden');
    weatherInfo.innerHTML = '<p class="text-gray-500">Fetching 10-day weather data...</p>';

    try {
        const targetDate = new Date(date);
        const forecastDays = 5; // We need 5 days of future forecast
        
        // Calculate historical start and end dates (5 days before)
        const historyStartDate = new Date(targetDate);
        historyStartDate.setDate(targetDate.getDate() - 5);
        const historyEndDate = new Date(targetDate);
        historyEndDate.setDate(targetDate.getDate() - 1);
        
        // Format dates to YYYY-MM-DD for the API
        const historyStartFormatted = historyStartDate.toISOString().split('T')[0];
        const historyEndFormatted = historyEndDate.toISOString().split('T')[0];
        
        // Call your secure server proxy endpoint ---
        const proxyUrl = `/api/weather?` + new URLSearchParams({
            destination: destination,
            historyStartFormatted: historyStartFormatted,
            historyEndFormatted: historyEndFormatted,
            forecastDays: forecastDays
        }).toString();

        console.log('Fetching weather with params:', { destination, historyStartFormatted, historyEndFormatted });


        const response = await fetch(proxyUrl);
        const proxyResult = await response.json();
        
        if (response.ok) {
            const historyData = proxyResult.historyData;
            const forecastData = proxyResult.forecastData;

            let allWeatherDays = [];

            // Add historical data
            historyData.forecast.forecastday.forEach(day => {
                allWeatherDays.push({
                    date: day.date,
                    temp_c: day.day.avgtemp_c,
                    condition: day.day.condition.text,
                    iconUrl: day.day.condition.icon
                });
            });

            // Add forecast data, skipping the first day which is the current date
            for (let i = 1; i < forecastData.forecast.forecastday.length; i++) {
                const day = forecastData.forecast.forecastday[i];
                allWeatherDays.push({
                    date: day.date,
                    temp_c: day.day.avgtemp_c,
                    condition: day.day.condition.text,
                    iconUrl: day.day.condition.icon
                });
            }
            
            let htmlOutput = `<span class="font-small my-2">${destination}</span>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">`;
            allWeatherDays.forEach(day => {
                // Parse the date string and get the day of the week
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                
                htmlOutput += `
                    <div class="p-4 border rounded-lg text-center">
                        <p class="font-bold">${day.date}</p>
                        <p class="text-sm text-gray-400">${dayName}</p>
                        <img src="${day.iconUrl}" alt="${day.condition}" class="w-12 h-12 mx-auto">
                        <p class="text-xl font-semibold">${day.temp_c}°C</p>
                        <p class="text-sm text-gray-500">${day.condition}</p>
                    </div>
                `;
            });
            htmlOutput += '</div>';

            weatherInfo.innerHTML = htmlOutput;

        } else {
            // Handle error from the proxy
            weatherInfo.innerHTML = `<p class="text-red-500">Could not retrieve 10-day weather for ${destination}. Error: ${proxyResult.error || 'Unknown'}</p>`;
        }
    } catch (error) {
        console.error('Weather API error:', error);
        weatherInfo.innerHTML = `<p class="text-red-500">Error fetching weather data. Please ensure the dates and location are valid.</p>`;
    }
}


function populateFlights(from, to, date) {
    const container = document.getElementById('flightsResults');
    container.innerHTML = '';
    
    const flightsToDisplay = mockData.flights || [];
    // ... rest of the function remains the same
    flightsToDisplay.forEach(flight => {

        const bookingUrl = `booking/?mode=flight&name=${encodeURIComponent(flight.airline)}&price=${flight.price}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`;
        
        const flightCard = `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50 to-indigo-50">
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="flex items-center space-x-4">
                            <div class="text-lg font-semibold text-gray-800">${flight.airline}</div>
                            <div class="text-sm text-gray-600">${flight.flightNumber}</div>
                            <div class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${flight.class}</div>
                        </div>
                        <div class="flex items-center space-x-6 mt-2">
                            <div class="text-center">
                                <div class="font-semibold text-lg">${flight.departure}</div>
                            </div>
                            <div class="flex-1 text-center">
                                <div class="text-sm text-gray-600">${flight.duration}</div>
                                <div class="border-t border-gray-300 mt-1"></div>
                            </div>
                            <div class="text-center">
                                <div class="font-semibold text-lg">${flight.arrival}</div>
                            </div>
                        </div>
                    </div>
                    <div class="text-right ml-4">
                        <div class="text-2xl font-bold text-green-600">₹${flight.price}</div>
                        <button class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" onclick="window.open('${bookingUrl}', '_blank')">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += flightCard;
    });
}

function populateTrains(from, to, date) {
    const container = document.getElementById('trainsResults');
    container.innerHTML = '';

    const trainsToDisplay = mockData.trains || [];
    // ... rest of the function remains the same
    trainsToDisplay.forEach(train => {
        const bookingUrl = `booking/?mode=train&name=${encodeURIComponent(train.trainName)}&price=${train.price}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`;
        const trainCard = `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-green-50 to-emerald-50">
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="flex items-center space-x-4">
                            <div class="text-lg font-semibold text-gray-800">${train.trainName}</div>
                            <div class="text-sm text-gray-600">${train.trainNumber}</div>
                            <div class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">${train.class}</div>
                        </div>
                        <div class="flex items-center space-x-6 mt-2">
                            <div class="text-center">
                                <div class="font-semibold text-lg">${train.departure}</div>
                            </div>
                            <div class="flex-1 text-center">
                                <div class="text-sm text-gray-600">${train.duration}</div>
                                <div class="border-t border-gray-300 mt-1"></div>
                            </div>
                            <div class="text-center">
                                <div class="font-semibold text-lg">${train.arrival}</div>
                            </div>
                        </div>
                    </div>
                    <div class="text-right ml-4">
                        <div class="text-2xl font-bold text-green-600">₹${train.price}</div>
                        <button class="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors" onclick="window.open('${bookingUrl}', '_blank')">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += trainCard;
    });
}

function populateBuses(from, to, date) {
    const container = document.getElementById('busesResults');
    container.innerHTML = '';
    
    const busesToDisplay = mockData.buses || [];
    // ... rest of the function remains the same
    busesToDisplay.forEach(bus => {
        const bookingUrl = `booking/?mode=bus&name=${encodeURIComponent(bus.busOperator)}&price=${bus.price}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`;
        const busCard = `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-orange-50 to-red-50">
                <div class="flex justify-between items-center">
                    <div class="flex-1">
                        <div class="flex items-center space-x-4">
                            <div class="text-lg font-semibold text-gray-800">${bus.busOperator}</div>
                            <div class="text-sm text-gray-600">${bus.busNumber}</div>
                            <div class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">${bus.type}</div>
                        </div>
                        <div class="flex items-center space-x-6 mt-2">
                            <div class="text-center">
                                <div class="font-semibold text-lg">${bus.departure}</div>
                            </div>
                            <div class="flex-1 text-center">
                                <div class="text-sm text-gray-600">${bus.duration}</div>
                                <div class="border-t border-gray-300 mt-1"></div>
                            </div>
                            <div class="text-center">
                                <div class="font-semibold text-lg">${bus.arrival}</div>
                            </div>
                        </div>
                    </div>
                    <div class="text-right ml-4">
                        <div class="text-2xl font-bold text-green-600">₹${bus.price}</div>
                        <button class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" onclick="window.open('${bookingUrl}')">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += busCard;
    });
}

function populateHotels(destination) {
    const container = document.getElementById('hotelsResults');
    container.innerHTML = '';

    const hotelsToDisplay = mockData.hotels || [];
    hotelsToDisplay.forEach(hotel => {
        const stars = '★'.repeat(Math.floor(hotel.rating)) + '☆'.repeat(5 - Math.floor(hotel.rating));
        
        // Prepare the data to be passed to the booking page
        const hotelData = {
            mode: 'hotel',
            name: hotel.name,
            price: hotel.price,
            location: hotel.location,
            rating: hotel.rating,
            amenities: hotel.amenities,
            image: hotel.image
        };
        const bookingUrl = `hotelBooking/?data=${encodeURIComponent(JSON.stringify(hotelData))}`;

        const hotelCard = `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-pink-50">
                <div class="flex items-start space-x-4">
                    <div class="text-4xl">${hotel.image}</div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800">${hotel.name}</h4>
                                <div class="text-sm text-yellow-500">${stars} ${hotel.rating}</div>
                                <div class="text-sm text-gray-600 mt-1">${hotel.location}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-xl font-bold text-green-600">₹${hotel.price}</div>
                                <div class="text-sm text-gray-600">per night</div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="flex flex-wrap gap-1">
                                ${hotel.amenities.map(amenity =>
            `<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">${amenity}</span>`
        ).join('')}
                            </div>
                        </div>
                        <button class="mt-3 w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors" onclick="window.open('${bookingUrl}', '_blank')">
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += hotelCard;
    });
}

async function geocodeLocation(locationName) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

async function initializeMap(destination) {
    const coordinates = await geocodeLocation(destination);

    if (!coordinates) {
        // Fallback to a default location (Mumbai)
        coordinates = { lat: 19.0760, lng: 72.8777, displayName: 'Mumbai, India' };
    }

    // Remove existing map if any
    if (map) {
        map.remove();
    }

    // Initialize the map
    map = L.map('mapContainer').setView([coordinates.lat, coordinates.lng], 13);

    // Add tile layer (street view)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add marker for destination
    const marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map);
    marker.bindPopup(`<b>${destination}</b><br>${coordinates.displayName}`).openPopup();

    // Add some mock nearby places
    addNearbyPlaces(coordinates.lat, coordinates.lng);
}

function addNearbyPlaces(lat, lng) {
    const nearbyPlaces = [
        { name: 'Airport', icon: '✈️', offset: [0.01, 0.01] },
        { name: 'Railway Station', icon: '🚂', offset: [-0.01, 0.01] },
        { name: 'Bus Station', icon: '🚌', offset: [0.01, -0.01] },
        { name: 'Shopping Mall', icon: '🛒', offset: [-0.005, -0.005] },
        { name: 'Hospital', icon: '🏥', offset: [0.008, -0.008] }
    ];

    nearbyPlaces.forEach(place => {
        const placeLat = lat + place.offset[0];
        const placeLng = lng + place.offset[1];

        const placeMarker = L.marker([placeLat, placeLng]).addTo(map);
        placeMarker.bindPopup(`<b>${place.icon} ${place.name}</b><br>Near your destination`);
    });
}

function showTrafficLayer() {
    alert('This feature is under development.');
}

function showSatelliteView() {
    if (map && currentMapLayer === 'street') {
        map.eachLayer(function (layer) {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles © Esri'
        }).addTo(map);

        currentMapLayer = 'satellite';
    } else if (map && currentMapLayer === 'satellite') {
        map.eachLayer(function (layer) {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        currentMapLayer = 'street';
    }
}

function findNearbyPlaces() {
    if (map) {
        alert('This feature is under development.');
    }
}

function populateTouristPlaces(destination) {
    const container = document.getElementById('touristResults');
    const destinationKey = destination.toLowerCase();

    // Get tourist places for the destination or use default
    const places = mockData.touristPlaces[destinationKey] || mockData.touristPlaces['default'];

    container.innerHTML = '';
    window.currentTouristPlaces = places; // Store for filtering

    places.forEach(place => {
        const stars = '★'.repeat(Math.floor(place.rating)) + '☆'.repeat(5 - Math.floor(place.rating));
        const categoryColors = {
            'historical': 'from-amber-50 to-orange-50 border-amber-200',
            'religious': 'from-purple-50 to-violet-50 border-purple-200',
            'nature': 'from-green-50 to-emerald-50 border-green-200',
            'entertainment': 'from-pink-50 to-rose-50 border-pink-200'
        };

        const placeCard = `
            <div class="tourist-card border rounded-lg p-4 bg-gradient-to-br ${categoryColors[place.category]} ${place.category}" data-category="${place.category}">
                <div class="flex items-start space-x-3">
                    <div class="text-3xl">${place.image}</div>
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-gray-800 mb-1">${place.name}</h4>
                        <div class="text-sm text-yellow-500 mb-2">${stars} ${place.rating}</div>
                        <p class="text-sm text-gray-600 mb-3">${place.description}</p>
                        
                        <div class="space-y-2 text-xs">
                            <div class="flex items-center space-x-4">
                                <span class="flex items-center">
                                    <span class="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                    <strong>Timings:</strong> ${place.timings}
                                </span>
                            </div>
                            <div class="flex items-center space-x-4">
                                <span class="flex items-center">
                                    <span class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                    <strong>Entry:</strong> ${place.entryFee}
                                </span>
                                <span class="flex items-center">
                                    <span class="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                                    <strong>Duration:</strong> ${place.duration}
                                </span>
                            </div>
                        </div>
                        
                        <div class="mt-3 flex space-x-2">
                            <button class="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                                Get Directions
                            </button>
                            <button class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += placeCard;
    });
}

function filterTouristPlaces(category) {
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('bg-gray-200', 'text-gray-700');
        btn.classList.remove('bg-blue-500', 'text-white');
    });

    // Set active button
    event.target.classList.add('active');
    event.target.classList.remove('bg-gray-200', 'text-gray-700');
    event.target.classList.add('bg-blue-500', 'text-white');

    // Filter tourist place cards
    const cards = document.querySelectorAll('.tourist-card');
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}


// --- TRAVEL SUGGESTIONS ---
async function getTravelSuggestions() {
  const destination = document.getElementById('toInput').value;
  const date = document.getElementById('dateInput').value;

  if (!destination || !date) {
    alert('Please enter a destination and a travel date first!');
    return;
  }

  const month = new Date(date).toLocaleString('default', { month: 'long' });

  const loadingIndicator = document.getElementById('geminiLoading');
  const packingSection = document.getElementById('packingSuggestionSection');
  const eventsSection = document.getElementById('eventsCalendarSection');
  const packingList = document.getElementById('packingList');
  const eventsList = document.getElementById('eventsList');

  loadingIndicator.classList.remove('hidden');
  packingSection.classList.add('hidden');
  eventsSection.classList.add('hidden');
  packingList.innerHTML = '';
  eventsList.innerHTML = '';

  try {
    const response = await fetch('http://localhost:3000/api/travel-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, month, date }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    // Packing suggestions
    if (data.packing_suggestion?.length > 0) {
      data.packing_suggestion.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        packingList.appendChild(li);
      });
    } else {
      packingList.innerHTML = '<li class="text-gray-500">No packing suggestions available.</li>';
    }
    packingSection.classList.remove('hidden');

    // Events calendar
    if (data.events_calendar?.length > 0) {
      data.events_calendar.forEach(event => {
        const div = document.createElement('div');
        div.innerHTML = `<strong>${event.name}</strong> (${event.date})<br>${event.description}`;
        eventsList.appendChild(div);
      });
    } else {
      eventsList.innerHTML = '<p class="text-gray-500">No specific events found for this period.</p>';
    }
    eventsSection.classList.remove('hidden');

  } catch (error) {
    console.error('API call failed:', error);
    alert('Failed to get suggestions. Please check the server and AI API key.');
  } finally {
    loadingIndicator.classList.add('hidden');
  }
}

// --- CHAT WITH HISTORY ---
let conversationHistory = [];

const chatModal = document.getElementById('chatModal');
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');

function openChat() {
  chatModal.classList.remove('hidden');
  chatModal.classList.add('flex');
}

function closeChat() {
  chatModal.classList.remove('flex');
  chatModal.classList.add('hidden');
  conversationHistory = []; // reset history
}

async function sendMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  const from = document.getElementById('fromInput').value;
  const to = document.getElementById('toInput').value;
  const date = document.getElementById('dateInput').value;

  if (!from || !to || !date) {
    appendMessage('AI', 'Please fill in travel details first.');
    return;
  }

  conversationHistory.push({ role: 'user', content: userMessage });
  appendMessage('You', userMessage);
  chatInput.value = '';

  const typingIndicator = document.createElement('div');
  typingIndicator.classList.add('text-gray-500', 'italic', 'text-sm');
  typingIndicator.textContent = 'AI is typing...';
  chatHistory.appendChild(typingIndicator);
  chatHistory.scrollTop = chatHistory.scrollHeight;

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, date, messages: conversationHistory }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    chatHistory.removeChild(typingIndicator);
    appendMessage('AI', data.reply);
    conversationHistory.push({ role: 'assistant', content: data.reply });

  } catch (error) {
    console.error('Chat API call failed:', error);
    chatHistory.removeChild(typingIndicator);
    appendMessage('AI', 'Sorry, I am unable to connect to the AI right now.');
  }
}

function appendMessage(sender, message) {
  const messageDiv = document.createElement('div');
  if (sender === 'You') {
    messageDiv.classList.add('flex', 'justify-end');
    messageDiv.innerHTML = `<div class="bg-blue-500 text-white rounded-lg p-3 max-w-[75%]">${message}</div>`;
  } else {
    messageDiv.classList.add('flex', 'justify-start');
    // Render Markdown
    messageDiv.innerHTML = `<div class="bg-gray-200 text-gray-800 rounded-lg p-3 max-w-[75%]">${marked.parse(message)}</div>`;
  }
  chatHistory.appendChild(messageDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});

// --- TRIP PLANNER (Markdown Output) ---
async function getTripPlan() {
  const from = document.getElementById('fromInput').value;
  const to = document.getElementById('toInput').value;
  const date = document.getElementById('dateInput').value;
  const budget = document.getElementById('budgetInput').value;
  const adults = document.getElementById('adultsInput').value;
  const children = document.getElementById('childrenInput').value;

  if (!from || !to || !date || !budget || !adults) {
    alert('Please fill in all travel details to get a trip plan.');
    return;
  }

  const tripPlanSection = document.getElementById('tripPlanSection');
  const tripPlanContent = document.getElementById('tripPlanContent');

  tripPlanSection.classList.remove('hidden');
  tripPlanContent.innerHTML = '<div>Loading your personalized plan...</div>';

  try {
    const response = await fetch('http://localhost:3000/api/trip-planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, date, budget, adults, children }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const markdownPlan = await response.text();
    tripPlanContent.innerHTML = marked.parse(markdownPlan);

  } catch (error) {
    console.error('Trip Planner API failed:', error);
    tripPlanContent.innerHTML = `<div class="text-red-500">Sorry, we couldn't generate a trip plan. Please try again later.</div>`;
  }
}
