// API Configuration
const API_BASE_URL = 'http://localhost:3003';

// Get selected currency
function getSelectedCurrency() {
    return document.getElementById('currency').value;
}

// Tab Switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${targetTab}-section`).classList.add('active');
    });
});

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('departure-date').min = today;
document.getElementById('return-date').min = today;
document.getElementById('check-in').min = today;
document.getElementById('check-out').min = today;

// Convert uppercase input
document.getElementById('departure').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});
document.getElementById('destination').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});
document.getElementById('hotel-city').addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Flight Search Form
document.getElementById('flight-search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        origin: document.getElementById('departure').value.toUpperCase(),
        destination: document.getElementById('destination').value.toUpperCase(),
        departureDate: document.getElementById('departure-date').value,
        returnDate: document.getElementById('return-date').value,
        adults: parseInt(document.getElementById('travelers').value),
        travelClass: document.getElementById('class').value,
        currency: getSelectedCurrency()
    };
    
    await searchFlights(formData);
});

// Hotel Search Form
document.getElementById('hotel-search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        cityCode: document.getElementById('hotel-city').value.toUpperCase(),
        checkInDate: document.getElementById('check-in').value,
        checkOutDate: document.getElementById('check-out').value,
        adults: parseInt(document.getElementById('adults').value),
        rooms: parseInt(document.getElementById('rooms').value),
        currency: getSelectedCurrency()
    };
    
    await searchHotels(formData);
});

// Search Flights Function
async function searchFlights(formData) {
    const resultsContainer = document.getElementById('flight-results');
    const resultsContent = document.getElementById('flight-results-content');
    const searchButton = document.querySelector('#flight-search-form .search-button');
    
    // Show loading state
    searchButton.disabled = true;
    searchButton.querySelector('.button-text').style.display = 'none';
    searchButton.querySelector('.button-loader').style.display = 'inline';
    
    resultsContainer.style.display = 'block';
    resultsContent.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Searching for real-time flights...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/search-flights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success && data.flights && data.flights.length > 0) {
            displayFlights(data.flights, formData.currency);
        } else {
            resultsContent.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">✈️</div>
                    <h3>No flights found</h3>
                    <p>${data.message || 'Try different dates or airports'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching flights:', error);
        resultsContent.innerHTML = `
            <div class="error-message">
                <h3>Error searching flights</h3>
                <p>${error.message || 'Please try again later'}</p>
            </div>
        `;
    } finally {
        searchButton.disabled = false;
        searchButton.querySelector('.button-text').style.display = 'inline';
        searchButton.querySelector('.button-loader').style.display = 'none';
    }
}

// Display Flights
function displayFlights(flights, currency) {
    const resultsContent = document.getElementById('flight-results-content');
    const currencySymbol = getCurrencySymbol(currency);
    
    resultsContent.innerHTML = flights.map(flight => `
        <div class="flight-card">
            <div class="flight-header">
                <div class="airline-info">
                    <div class="airline-logo">${flight.airlineIcon || '✈️'}</div>
                    <div class="airline-details">
                        <h3>${flight.airline}</h3>
                        <div class="flight-number">${flight.carrierCode} ${flight.flightNumber}</div>
                    </div>
                </div>
                <div class="price-tag">
                    <span class="price-amount">${currencySymbol}${formatPrice(flight.price)}</span>
                    <span class="price-label">total for ${flight.travelers} traveler(s)</span>
                </div>
            </div>
            
            <div class="flight-route">
                <div class="route-point">
                    <span class="route-time">${formatTime(flight.departureTime)}</span>
                    <div class="route-code">${flight.departureAirport}</div>
                    <div class="route-city">${flight.departureCity || ''}</div>
                    <div class="route-date">${formatDate(flight.departureTime)}</div>
                </div>
                
                <div class="route-arrow">
                    <div>→</div>
                    <span class="duration">${flight.duration}</span>
                    ${flight.stops > 0 ? `<div style="font-size: 12px; color: #f59e0b;">${flight.stops} stop${flight.stops > 1 ? 's' : ''}</div>` : '<div style="font-size: 12px; color: #10b981;">Non-stop</div>'}
                </div>
                
                <div class="route-point">
                    <span class="route-time">${formatTime(flight.arrivalTime)}</span>
                    <div class="route-code">${flight.arrivalAirport}</div>
                    <div class="route-city">${flight.arrivalCity || ''}</div>
                    <div class="route-date">${formatDate(flight.arrivalTime)}</div>
                </div>
            </div>
            
            <div class="flight-details">
                <div class="detail-item">
                    <span class="detail-icon">💺</span>
                    <span class="detail-text">${flight.cabin}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">✈️</span>
                    <span class="detail-text">${flight.aircraft || 'Aircraft'}</span>
                </div>
                ${flight.amenities ? `
                <div class="detail-item">
                    <span class="detail-icon">📡</span>
                    <span class="detail-text">${flight.amenities}</span>
                </div>
                ` : ''}
            </div>
            
            <button class="book-button" onclick="bookFlight('${flight.carrierCode}${flight.flightNumber}', '${currencySymbol}${formatPrice(flight.price)}')">
                Select Flight
            </button>
        </div>
    `).join('');
}

// Search Hotels Function
async function searchHotels(formData) {
    const resultsContainer = document.getElementById('hotel-results');
    const resultsContent = document.getElementById('hotel-results-content');
    const searchButton = document.querySelector('#hotel-search-form .search-button');
    
    // Show loading state
    searchButton.disabled = true;
    searchButton.querySelector('.button-text').style.display = 'none';
    searchButton.querySelector('.button-loader').style.display = 'inline';
    
    resultsContainer.style.display = 'block';
    resultsContent.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Searching for real-time hotels...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/search-hotels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success && data.hotels && data.hotels.length > 0) {
            displayHotels(data.hotels, formData.currency);
        } else {
            resultsContent.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🏨</div>
                    <h3>No hotels found</h3>
                    <p>${data.message || 'Try different dates or city code'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error searching hotels:', error);
        resultsContent.innerHTML = `
            <div class="error-message">
                <h3>Error searching hotels</h3>
                <p>${error.message || 'Please try again later'}</p>
            </div>
        `;
    } finally {
        searchButton.disabled = false;
        searchButton.querySelector('.button-text').style.display = 'inline';
        searchButton.querySelector('.button-loader').style.display = 'none';
    }
}

// Display Hotels
function displayHotels(hotels, currency) {
    const resultsContent = document.getElementById('hotel-results-content');
    const currencySymbol = getCurrencySymbol(currency);
    
    resultsContent.innerHTML = hotels.map(hotel => `
        <div class="hotel-card">
            ${hotel.imageUrl ? 
                `<img src="${hotel.imageUrl}" alt="${hotel.name}" class="hotel-image-real" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="hotel-image" style="display:none;">${hotel.icon || '🏨'}</div>` 
                : 
                `<div class="hotel-image">${hotel.icon || '🏨'}</div>`
            }
            
            <div class="hotel-info">
                <div class="hotel-header">
                    <div>
                        <h3 class="hotel-name">${hotel.name}</h3>
                        ${hotel.rating ? `
                        <div class="hotel-rating">
                            ${'⭐'.repeat(Math.round(hotel.rating))}
                            <span style="color: #666; font-size: 14px;">(${hotel.rating} stars)</span>
                        </div>
                        ` : ''}
                        <div class="hotel-address">
                            <span>📍</span>
                            <span>${hotel.address || hotel.cityName || 'Location available'}</span>
                        </div>
                        ${hotel.distance ? `
                        <div class="hotel-address">
                            <span>🚗</span>
                            <span>${hotel.distance}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="hotel-price">
                        <div class="hotel-price-amount">${currencySymbol}${formatPrice(hotel.pricePerNight)}</div>
                        <div class="hotel-price-label">per night</div>
                        ${hotel.totalPrice ? `<div class="hotel-price-total">Total (${hotel.nights} night${hotel.nights > 1 ? 's' : ''}): ${currencySymbol}${formatPrice(hotel.totalPrice)}</div>` : ''}
                    </div>
                </div>
                
                ${hotel.amenities && hotel.amenities.length > 0 ? `
                <div class="hotel-amenities">
                    ${hotel.amenities.slice(0, 6).map(amenity => `
                        <span class="amenity-tag">
                            <span>${getAmenityIcon(amenity)}</span>
                            <span>${amenity}</span>
                        </span>
                    `).join('')}
                </div>
                ` : ''}
                
                ${hotel.description ? `<p class="hotel-description">${hotel.description}</p>` : ''}
                
                <button class="book-button" onclick="bookHotel('${hotel.hotelId.replace(/'/g, "\\'")}', '${hotel.name.replace(/'/g, "\\'")}', '${currencySymbol}${formatPrice(hotel.totalPrice || hotel.pricePerNight)}')">
                    Book Now - ${currencySymbol}${formatPrice(hotel.totalPrice || hotel.pricePerNight)}
                </button>
            </div>
        </div>
    `).join('');
}

// Helper Functions
function getCurrencySymbol(currency) {
    const symbols = {
        'USD': '$',
        'INR': '₹',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$',
        'CAD': 'C$',
        'SGD': 'S$'
    };
    return symbols[currency] || currency + ' ';
}

function formatPrice(price) {
    return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

function formatDate(datetime) {
    const date = new Date(datetime);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
    });
}

function getAmenityIcon(amenity) {
    const icons = {
        'WiFi': '📶',
        'Free WiFi': '📶',
        'WIFI': '📶',
        'Parking': '🅿️',
        'PARKING': '🅿️',
        'Pool': '🏊',
        'SWIMMING_POOL': '🏊',
        'Gym': '💪',
        'FITNESS_CENTER': '💪',
        'Spa': '🧖',
        'SPA': '🧖',
        'Restaurant': '🍽️',
        'RESTAURANT': '🍽️',
        'Bar': '🍸',
        'Room Service': '🛎️',
        'ROOM_SERVICE': '🛎️',
        'Air Conditioning': '❄️',
        'AIR_CONDITIONING': '❄️',
        'Breakfast': '🍳',
        'Pet Friendly': '🐕',
        'Airport Shuttle': '🚐',
        'Business Center': '💼',
        'Laundry': '👔'
    };
    return icons[amenity] || '✓';
}

function bookFlight(flightNumber, price) {
    alert(`Booking flight ${flightNumber} for ${price}.\n\nThis would redirect to payment in a real application.`);
}

function bookHotel(hotelId, hotelName, price) {
    alert(`Booking ${hotelName} for ${price}.\n\nThis would redirect to payment in a real application.`);
}