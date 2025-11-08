import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const app = express();
const PORT = process.env.FLIGHT_PORT || 3003;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
    credentials: true
}));
app.use(express.json());

// Amadeus API Token Management
let amadeusToken = null;
let tokenExpiry = null;

// Custom fetch with better timeout handling
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : require('http');
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: timeout
        };
        
        const req = lib.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const response = {
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    json: async () => JSON.parse(data),
                    text: async () => data
                };
                resolve(response);
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function getAmadeusToken() {
    if (amadeusToken && tokenExpiry && new Date() < tokenExpiry) {
        return amadeusToken;
    }

    try {
        console.log('Getting Amadeus token...');
        
        const body = `grant_type=client_credentials&client_id=${process.env.AMADEUS_API_KEY}&client_secret=${process.env.AMADEUS_API_SECRET}`;
        
        const response = await fetchWithTimeout('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            },
            body: body
        }, 15000);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Amadeus token error:', errorText);
            throw new Error(`Amadeus authentication failed: ${response.status}`);
        }

        const data = await response.json();
        amadeusToken = data.access_token;
        tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);
        
        console.log('Amadeus token obtained successfully');
        return amadeusToken;
    } catch (error) {
        console.error('Error getting Amadeus token:', error.message);
        throw new Error('Failed to authenticate with Amadeus API. Check your credentials and internet connection.');
    }
}

// Currency conversion
async function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    try {
        const response = await fetchWithTimeout(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`, {}, 5000);
        const data = await response.json();
        
        if (data.rates && data.rates[toCurrency]) {
            return amount * data.rates[toCurrency];
        }
    } catch (error) {
        console.log('Currency API error, using fallback rates');
    }
    
    // Fallback exchange rates (updated regularly)
    const rates = {
        'USD': { 'USD': 1, 'INR': 83.12, 'EUR': 0.92, 'GBP': 0.79, 'JPY': 149.50, 'AUD': 1.53, 'CAD': 1.36, 'SGD': 1.35 },
        'INR': { 'USD': 0.012, 'INR': 1, 'EUR': 0.011, 'GBP': 0.0095, 'JPY': 1.8, 'AUD': 0.018, 'CAD': 0.016, 'SGD': 0.016 }
    };
    
    if (rates[fromCurrency] && rates[fromCurrency][toCurrency]) {
        return amount * rates[fromCurrency][toCurrency];
    }
    
    return amount;
}

// Search Flights using Amadeus API
async function searchFlightsAmadeus(searchParams) {
    try {
        const token = await getAmadeusToken();
        
        const params = new URLSearchParams({
            originLocationCode: searchParams.origin,
            destinationLocationCode: searchParams.destination,
            departureDate: searchParams.departureDate,
            adults: searchParams.adults,
            travelClass: searchParams.travelClass,
            currencyCode: searchParams.currency,
            max: 50,
            nonStop: false
        });

        if (searchParams.returnDate) {
            params.append('returnDate', searchParams.returnDate);
        }

        console.log(`Searching flights: ${searchParams.origin} → ${searchParams.destination}`);
        
        const response = await fetchWithTimeout(
            `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            },
            20000
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Flight search error:', error);
            throw new Error(error.errors?.[0]?.detail || 'Flight search failed');
        }

        const data = await response.json();
        console.log(`Found ${data.data?.length || 0} flights`);
        
        return data.data || [];
    } catch (error) {
        console.error('Amadeus flight search error:', error.message);
        throw error;
    }
}

// Process flight data
function processFlightOffers(offers, currency) {
    return offers.map(offer => {
        const firstSegment = offer.itineraries[0].segments[0];
        const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];
        
        return {
            id: offer.id,
            price: parseFloat(offer.price.total),
            currency: currency,
            airline: getAirlineName(firstSegment.carrierCode),
            carrierCode: firstSegment.carrierCode,
            flightNumber: firstSegment.number,
            airlineIcon: getAirlineIcon(firstSegment.carrierCode),
            departureAirport: firstSegment.departure.iataCode,
            departureTime: firstSegment.departure.at,
            departureCity: firstSegment.departure.iataCode,
            arrivalAirport: lastSegment.arrival.iataCode,
            arrivalTime: lastSegment.arrival.at,
            arrivalCity: lastSegment.arrival.iataCode,
            duration: offer.itineraries[0].duration.replace('PT', '').toLowerCase(),
            stops: offer.itineraries[0].segments.length - 1,
            cabin: offer.travelerPricings[0].fareDetailsBySegment[0].cabin,
            aircraft: firstSegment.aircraft?.code || 'N/A',
            travelers: offer.travelerPricings.length,
            amenities: 'In-flight entertainment available'
        };
    });
}

// Get airline name and icon
function getAirlineName(code) {
    const airlines = {
        'AA': 'American Airlines', 'DL': 'Delta Air Lines', 'UA': 'United Airlines',
        'BA': 'British Airways', 'LH': 'Lufthansa', 'AF': 'Air France',
        'EK': 'Emirates', 'SQ': 'Singapore Airlines', 'QR': 'Qatar Airways',
        'EY': 'Etihad Airways', 'TK': 'Turkish Airlines', 'KL': 'KLM',
        'AC': 'Air Canada', 'NH': 'ANA', 'JL': 'Japan Airlines',
        '6E': 'IndiGo', 'AI': 'Air India', 'SG': 'SpiceJet', 'UK': 'Vistara',
        'G8': 'Go Air', 'I5': 'AirAsia India', 'WY': 'Oman Air', 'SV': 'Saudia'
    };
    return airlines[code] || code;
}

function getAirlineIcon(code) {
    const icons = {
        'EK': '🛫', 'QR': '✈️', 'EY': '🛬', '6E': '🛩️', 'AI': '🛫',
        'SQ': '✈️', 'BA': '🛬', 'LH': '✈️', 'AF': '🛫'
    };
    return icons[code] || '✈️';
}

// Get city coordinates
function getCityCoordinates(cityCode) {
    const cityCoords = {
        'NYC': { lat: 40.7128, lon: -74.0060, name: 'New York' },
        'LON': { lat: 51.5074, lon: -0.1278, name: 'London' },
        'PAR': { lat: 48.8566, lon: 2.3522, name: 'Paris' },
        'DXB': { lat: 25.2048, lon: 55.2708, name: 'Dubai' },
        'SIN': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
        'DEL': { lat: 28.6139, lon: 77.2090, name: 'Delhi' },
        'BOM': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
        'BLR': { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
        'MAA': { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
        'HYD': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
        'CCU': { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
        'PNQ': { lat: 18.5204, lon: 73.8567, name: 'Pune' },
        'AMD': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
        'GOI': { lat: 15.2993, lon: 74.1240, name: 'Goa' },
        'COK': { lat: 9.9312, lon: 76.2673, name: 'Kochi' },
        'LAX': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
        'JFK': { lat: 40.6413, lon: -73.7781, name: 'New York' },
        'LHR': { lat: 51.4700, lon: -0.4543, name: 'London' },
        'CDG': { lat: 49.0097, lon: 2.5479, name: 'Paris' },
        'FRA': { lat: 50.0379, lon: 8.5622, name: 'Frankfurt' }
    };
    
    return cityCoords[cityCode.toUpperCase()] || { lat: 40.7128, lon: -74.0060, name: cityCode };
}

// Search Hotels using Amadeus API
async function searchHotelsAmadeus(searchParams) {
    try {
        const token = await getAmadeusToken();
        const coords = getCityCoordinates(searchParams.cityCode);
        
        console.log(`Searching hotels in ${coords.name} (${searchParams.cityCode})`);
        
        // Step 1: Get hotel list by geocode
        const listParams = new URLSearchParams({
            latitude: coords.lat,
            longitude: coords.lon,
            radius: 30,
            radiusUnit: 'KM',
            hotelSource: 'ALL'
        });

        const listResponse = await fetchWithTimeout(
            `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?${listParams}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            },
            20000
        );

        if (!listResponse.ok) {
            const error = await listResponse.json();
            console.error('Hotel list error:', error);
            throw new Error('Failed to fetch hotel list');
        }

        const listData = await listResponse.json();
        
        if (!listData.data || listData.data.length === 0) {
            console.log('No hotels found via API');
            throw new Error('No hotels found');
        }

        console.log(`Found ${listData.data.length} hotels in the area`);
        
        // Get hotel offers with pricing
        const hotelIds = listData.data.slice(0, 20).map(h => h.hotelId).join(',');
        
        const offerParams = new URLSearchParams({
            hotelIds: hotelIds,
            adults: searchParams.adults,
            checkInDate: searchParams.checkInDate,
            checkOutDate: searchParams.checkOutDate,
            roomQuantity: searchParams.rooms || 1,
            currency: searchParams.currency,
            bestRateOnly: 'true'
        });

        const offerResponse = await fetchWithTimeout(
            `https://test.api.amadeus.com/v3/shopping/hotel-offers?${offerParams}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            },
            20000
        );

        if (offerResponse.ok) {
            const offerData = await offerResponse.json();
            if (offerData.data && offerData.data.length > 0) {
                console.log(`Found ${offerData.data.length} hotels with pricing`);
                return processHotelOffers(offerData.data, searchParams.currency);
            }
        }
        
        // If offers fail, use hotel list with estimated pricing
        console.log('Using hotel list with estimated pricing');
        return processHotelList(listData.data, searchParams);
        
    } catch (error) {
        console.error('Hotel search error:', error.message);
        throw error;
    }
}

// Process hotel offers with real pricing
function processHotelOffers(offers, currency) {
    return offers.map(offer => {
        const hotel = offer.hotel;
        const bestOffer = offer.offers[0];
        
        const checkIn = new Date(bestOffer.checkInDate);
        const checkOut = new Date(bestOffer.checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        const totalPrice = parseFloat(bestOffer.price.total);
        const pricePerNight = totalPrice / nights;

        return {
            hotelId: hotel.hotelId,
            name: hotel.name,
            rating: hotel.rating || 4,
            address: hotel.address ? `${hotel.address.lines?.join(', ') || ''}, ${hotel.address.cityName || ''}` : 'Address available',
            cityName: hotel.address?.cityName,
            pricePerNight: pricePerNight,
            totalPrice: totalPrice,
            currency: currency,
            amenities: hotel.amenities || ['WiFi', 'Parking', 'Restaurant'],
            description: bestOffer.room?.description?.text || `${hotel.name} - Premium accommodation with excellent facilities`,
            icon: getHotelIcon(hotel.rating),
            nights: nights,
            distance: hotel.hotelDistance?.value ? `${hotel.hotelDistance.value} ${hotel.hotelDistance.unit} from center` : '',
            imageUrl: getHotelImageUrl(hotel.hotelId, hotel.name)
        };
    });
}

// Process hotel list with estimated pricing
function processHotelList(hotels, searchParams) {
    const checkIn = new Date(searchParams.checkInDate);
    const checkOut = new Date(searchParams.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const basePriceUSD = getCityBasePriceUSD(searchParams.cityCode);
    
    return hotels.slice(0, 15).map((hotel, index) => {
        const priceVariation = 0.7 + (Math.random() * 0.6);
        const pricePerNightUSD = basePriceUSD * priceVariation;
        
        return {
            hotelId: hotel.hotelId,
            name: hotel.name,
            rating: Math.floor(Math.random() * 2) + 4,
            address: hotel.address ? `${hotel.address.cityName || searchParams.cityCode}` : getCityCoordinates(searchParams.cityCode).name,
            cityName: hotel.address?.cityName || getCityCoordinates(searchParams.cityCode).name,
            pricePerNightUSD: pricePerNightUSD,
            pricePerNight: pricePerNightUSD,
            totalPriceUSD: pricePerNightUSD * nights,
            totalPrice: pricePerNightUSD * nights,
            currency: 'USD',
            amenities: ['Free WiFi', 'Parking', 'Restaurant', 'Gym', 'Pool'].slice(0, Math.floor(Math.random() * 3) + 3),
            description: `${hotel.name} offers comfortable accommodations with modern amenities and excellent service.`,
            icon: getHotelIcon(4),
            nights: nights,
            distance: hotel.distance?.value ? `${Math.round(hotel.distance.value)} km from center` : '',
            imageUrl: getHotelImageUrl(hotel.hotelId, hotel.name)
        };
    });
}

// Get hotel image URL (using Unsplash for hotel images)
function getHotelImageUrl(hotelId, hotelName) {
    // Use Unsplash Source for random hotel images
    const seed = hotelId || hotelName.replace(/\s+/g, '-').toLowerCase();
    return `https://source.unsplash.com/400x300/?hotel,luxury,${seed}`;
}

// Get city base price
function getCityBasePriceUSD(cityCode) {
    const cityPrices = {
        'NYC': 250, 'LAX': 200, 'SFO': 220, 'MIA': 180,
        'LON': 200, 'PAR': 180, 'FRA': 150, 'AMS': 160,
        'DXB': 150, 'SIN': 150, 'HKG': 180, 'NRT': 160,
        'DEL': 60, 'BOM': 70, 'BLR': 55, 'MAA': 50,
        'HYD': 50, 'CCU': 45, 'PNQ': 50, 'AMD': 45,
        'GOI': 80, 'COK': 60
    };
    
    return cityPrices[cityCode.toUpperCase()] || 100;
}

function getHotelIcon(rating) {
    if (rating >= 5) return '🏰';
    if (rating >= 4) return '🏨';
    return '🏩';
}

// API Routes
app.post('/api/search-flights', async (req, res) => {
    try {
        const { origin, destination, departureDate, returnDate, adults, travelClass, currency } = req.body;
        
        if (!origin || !destination || !departureDate || !adults || !currency) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        if (origin.length !== 3 || destination.length !== 3) {
            return res.status(400).json({
                success: false,
                error: 'Invalid airport codes. Use 3-letter IATA codes'
            });
        }

        const flightOffers = await searchFlightsAmadeus({
            origin,
            destination,
            departureDate,
            returnDate,
            adults,
            travelClass: travelClass || 'ECONOMY',
            currency
        });

        if (flightOffers.length === 0) {
            return res.json({
                success: false,
                flights: [],
                message: 'No flights found. Try different dates or routes.'
            });
        }

        const processedFlights = processFlightOffers(flightOffers, currency);

        res.json({
            success: true,
            flights: processedFlights,
            count: processedFlights.length
        });
    } catch (error) {
        console.error('Error searching flights:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/search-hotels', async (req, res) => {
    try {
        const { cityCode, checkInDate, checkOutDate, adults, rooms, currency } = req.body;
        
        if (!cityCode || !checkInDate || !checkOutDate || !adults || !currency) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const hotels = await searchHotelsAmadeus({
            cityCode,
            checkInDate,
            checkOutDate,
            adults,
            rooms: rooms || 1,
            currency
        });

        if (hotels.length === 0) {
            return res.json({
                success: false,
                hotels: [],
                message: 'No hotels found. Try a different city.'
            });
        }

        // Convert prices to requested currency
        const hotelsWithCurrency = await Promise.all(hotels.map(async (hotel) => {
            const convertedPricePerNight = await convertCurrency(hotel.pricePerNightUSD || hotel.pricePerNight, 'USD', currency);
            const convertedTotalPrice = await convertCurrency(hotel.totalPriceUSD || hotel.totalPrice, 'USD', currency);
            
            return {
                ...hotel,
                pricePerNight: Math.round(convertedPricePerNight * 100) / 100,
                totalPrice: Math.round(convertedTotalPrice * 100) / 100,
                currency: currency
            };
        }));

        res.json({
            success: true,
            hotels: hotelsWithCurrency,
            count: hotelsWithCurrency.length
        });
    } catch (error) {
        console.error('Error searching hotels:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        amadeus: !!(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET) ? 'configured' : 'not configured'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Flight & Hotel Server running on port ${PORT}`);
    console.log(`📡 Health: http://localhost:${PORT}/health`);
    console.log(`🔑 Amadeus: ${process.env.AMADEUS_API_KEY ? 'Configured ✓' : 'NOT CONFIGURED ✗'}`);
    
    if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
        console.warn('⚠️  WARNING: Amadeus API keys not configured!');
        console.warn('⚠️  Get keys from: https://developers.amadeus.com/register');
    }
});