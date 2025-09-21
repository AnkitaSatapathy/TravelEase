class AITripPlanner {
  constructor() {
    // Backend server configuration
    this.backendUrl = 'http://localhost:3001';
    this.apiEndpoint = `${this.backendUrl}/api/generate-trip`;
    
    // Fallback mode - set to true to use offline mode for testing
    this.fallbackMode = false;
  }

  async generateTripPlan(userData) {
    console.log('🤖 Starting AI trip plan generation...');
    console.log('🎯 Destination:', userData.destination);
    console.log('🔧 Fallback mode:', this.fallbackMode);
    
    try {
      if (this.fallbackMode) {
        console.log('⚠️ Using offline mode');
        return await this.generateOfflinePlan(userData);
      }
      
      console.log('🌐 Calling backend API...');
      const response = await this.callBackendAPI(userData);
      console.log('✅ Received response from backend');
      
      return response;
      
    } catch (error) {
      console.error('❌ Error in generateTripPlan:', error);
      console.log('🔄 Falling back to offline mode...');
      return await this.generateOfflinePlan(userData);
    }
  }

  async callBackendAPI(userData) {
    try {
      console.log('🔗 Making request to backend:', this.apiEndpoint);
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      console.log('📡 Backend response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Backend error:', errorData);
        throw new Error(`Backend request failed: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('✅ Successfully received trip plan from AI');
        return data.data;
      } else {
        throw new Error('Invalid response format from backend');
      }
      
    } catch (error) {
      console.error('❌ Backend API call failed:', error.message);
      throw error;
    }
  }

  // Enhanced offline plan generator with better data
  async generateOfflinePlan(userData) {
    console.log('🔧 Generating offline plan for:', userData.destination);
    
    const destination = userData.destination.toLowerCase().trim();
    const destinationAnalysis = this.analyzeDestination(destination, userData.destination);
    const days = parseInt(userData.days.replace(/\D/g, '')) || parseInt(userData.days);
    
    return {
      destination: {
        name: userData.destination,
        country: destinationAnalysis.country,
        region: destinationAnalysis.region,
        type: destinationAnalysis.type,
        description: destinationAnalysis.description,
        bestTime: destinationAnalysis.bestTime,
        climate: this.getCurrentSeasonInfo(destinationAnalysis.type),
        currency: destinationAnalysis.currency,
        language: destinationAnalysis.language,
        timeZone: destinationAnalysis.timeZone
      },
      attractions: this.generateSmartAttractions(userData.destination, destinationAnalysis.type),
      activities: this.generateSmartActivities(destinationAnalysis.type, userData.activities, userData.age),
      cuisine: this.generateSmartCuisine(userData.destination, destinationAnalysis.region),
      dailyItinerary: this.generateSmartItinerary(days, destinationAnalysis, userData),
      budget: this.calculateSmartBudget(days, userData.people, userData.hotel, userData.transport, destinationAnalysis.type),
      accommodation: this.generateAccommodationOptions(destinationAnalysis.type),
      transportation: this.generateTransportOptions(destinationAnalysis.type),
      tips: this.generateSmartTips(destinationAnalysis, userData.transport, userData.age),
      shopping: this.generateShoppingRecommendations(userData.destination, destinationAnalysis.region),
      emergency: this.generateEmergencyInfo(destinationAnalysis.country),
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'offline',
        processingTime: 0
      }
    };
  }

  analyzeDestination(destination, originalName) {
    const name = destination.toLowerCase();
    
    const globalDestinations = {
      // Enhanced Indian destinations
      hyderabad: { 
        country: 'India', region: 'Telangana', type: 'metropolitan', 
        currency: '₹ (Indian Rupee)', language: 'Telugu, Hindi, English',
        description: 'City of Pearls and Nizams, famous for Biryani and IT industry',
        bestTime: 'October to March'
      },
      bhubaneswar: { 
        country: 'India', region: 'Odisha', type: 'heritage', 
        currency: '₹ (Indian Rupee)', language: 'Odia, Hindi, English',
        description: 'Temple City of India with ancient Kalinga architecture and caves',
        bestTime: 'October to March'
      },
      mumbai: { 
        country: 'India', region: 'Maharashtra', type: 'metropolitan', 
        currency: '₹ (Indian Rupee)', language: 'Hindi, Marathi, English',
        description: 'Financial capital and Bollywood hub of India',
        bestTime: 'November to February'
      },
      delhi: { 
        country: 'India', region: 'NCT', type: 'metropolitan', 
        currency: '₹ (Indian Rupee)', language: 'Hindi, English',
        description: 'Capital city with rich Mughal and British heritage',
        bestTime: 'October to March'
      },
      bangalore: { 
        country: 'India', region: 'Karnataka', type: 'metropolitan', 
        currency: '₹ (Indian Rupee)', language: 'Kannada, English',
        description: 'Silicon Valley of India with pleasant weather',
        bestTime: 'October to February'
      },
      chennai: { 
        country: 'India', region: 'Tamil Nadu', type: 'metropolitan', 
        currency: '₹ (Indian Rupee)', language: 'Tamil, English',
        description: 'Cultural capital of South India and major port city',
        bestTime: 'November to February'
      },
      kolkata: { 
        country: 'India', region: 'West Bengal', type: 'metropolitan', 
        currency: '₹ (Indian Rupee)', language: 'Bengali, Hindi, English',
        description: 'City of Joy with rich literary and cultural heritage',
        bestTime: 'October to March'
      },
      jaipur: { 
        country: 'India', region: 'Rajasthan', type: 'heritage', 
        currency: '₹ (Indian Rupee)', language: 'Hindi, Rajasthani, English',
        description: 'Pink City with magnificent palaces and forts',
        bestTime: 'October to March'
      },
      agra: { 
        country: 'India', region: 'Uttar Pradesh', type: 'heritage', 
        currency: '₹ (Indian Rupee)', language: 'Hindi, English',
        description: 'Home to the iconic Taj Mahal and Mughal architecture',
        bestTime: 'October to March'
      },
      goa: { 
        country: 'India', region: 'Goa', type: 'beach', 
        currency: '₹ (Indian Rupee)', language: 'Konkani, Portuguese, English',
        description: 'Tropical paradise with beaches and Portuguese heritage',
        bestTime: 'November to February'
      },
      shimla: { 
        country: 'India', region: 'Himachal Pradesh', type: 'mountain', 
        currency: '₹ (Indian Rupee)', language: 'Hindi, English',
        description: 'Queen of Hills with colonial charm and pine forests',
        bestTime: 'March to June, September to December'
      },
      manali: { 
        country: 'India', region: 'Himachal Pradesh', type: 'adventure', 
        currency: '₹ (Indian Rupee)', language: 'Hindi, English',
        description: 'Adventure capital with snow-capped peaks and valleys',
        bestTime: 'May to October'
      },
      
      // International destinations
      paris: { 
        country: 'France', region: 'Île-de-France', type: 'heritage', 
        currency: '€ (Euro)', language: 'French, English',
        description: 'City of Light with world-class art, cuisine, and romance',
        bestTime: 'April to June, September to October'
      },
      london: { 
        country: 'UK', region: 'England', type: 'metropolitan', 
        currency: '£ (Pound Sterling)', language: 'English',
        description: 'Historic capital with royal heritage and modern culture',
        bestTime: 'May to September'
      },
      tokyo: { 
        country: 'Japan', region: 'Kanto', type: 'metropolitan', 
        currency: '¥ (Japanese Yen)', language: 'Japanese, English',
        description: 'Futuristic metropolis blending tradition with technology',
        bestTime: 'March to May, September to November'
      },
      dubai: { 
        country: 'UAE', region: 'Dubai', type: 'modern', 
        currency: 'AED (UAE Dirham)', language: 'Arabic, English',
        description: 'Luxury destination with modern architecture and shopping',
        bestTime: 'November to March'
      },
      singapore: { 
        country: 'Singapore', region: 'Singapore', type: 'metropolitan', 
        currency: 'SGD (Singapore Dollar)', language: 'English, Mandarin, Malay, Tamil',
        description: 'Garden city-state with diverse culture and cuisine',
        bestTime: 'February to April'
      }
    };
    
    // Direct match
    if (globalDestinations[name]) {
      const info = globalDestinations[name];
      return {
        ...info,
        timeZone: this.getTimeZone(info.country)
      };
    }
    
    // Enhanced pattern matching
    const patterns = {
      mountain: ['hill', 'mountain', 'peak', 'valley', 'shimla', 'manali', 'ooty', 'darjeeling', 'munnar', 'kodai', 'mussoorie', 'nainital'],
      beach: ['beach', 'coastal', 'island', 'goa', 'kerala', 'maldives', 'bali', 'phuket', 'andaman', 'lakshadweep', 'pondicherry'],
      heritage: ['fort', 'palace', 'temple', 'monument', 'historical', 'ancient', 'agra', 'varanasi', 'khajuraho', 'hampi', 'ujjain', 'pushkar'],
      adventure: ['trek', 'adventure', 'sports', 'rishikesh', 'leh', 'ladakh', 'nepal', 'kasol', 'tosh', 'malana'],
      metropolitan: ['city', 'metro', 'urban', 'bangalore', 'pune', 'ahmedabad', 'surat', 'kochi', 'indore']
    };
    
    let detectedType = 'general';
    for (let [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        detectedType = type;
        break;
      }
    }
    
    return {
      country: 'India',
      region: 'India',
      type: detectedType,
      description: this.generateDestinationDescription(originalName, detectedType),
      bestTime: 'October to March',
      currency: '₹ (Indian Rupee)',
      language: 'Local language, Hindi, English',
      timeZone: 'IST (UTC+5:30)'
    };
  }

  generateDestinationDescription(destination, type) {
    const descriptions = {
      metropolitan: `${destination} is a vibrant metropolitan city known for its modern infrastructure, cultural diversity, and urban attractions.`,
      heritage: `${destination} is a historic destination famous for its rich cultural heritage, ancient monuments, and traditional architecture.`,
      beach: `${destination} is a beautiful coastal destination offering pristine beaches, water activities, and tropical experiences.`,
      mountain: `${destination} is a scenic mountain destination perfect for nature lovers seeking cool climate and breathtaking views.`,
      adventure: `${destination} is an adventure hub ideal for thrill-seekers and outdoor enthusiasts looking for exciting activities.`,
      modern: `${destination} is a modern city showcasing contemporary architecture, shopping, and urban lifestyle.`,
      general: `${destination} is a fascinating destination offering unique local experiences and cultural attractions.`
    };
    
    return descriptions[type] || descriptions.general;
  }

  generateSmartAttractions(destination, type) {
    // Enhanced specific attractions database
    const specificAttractions = {
      'Bhubaneswar': [
        { name: 'Lingaraj Temple', description: 'Ancient 11th-century temple dedicated to Lord Shiva, architectural masterpiece', category: 'spiritual', visitDuration: '1-2 hours', entryFee: 'Free', bestTimeToVisit: 'Early morning', location: 'Old Town, Lingaraj Nagar' },
        { name: 'Khandagiri & Udayagiri Caves', description: 'Ancient Jain rock-cut caves from 2nd century BCE with inscriptions', category: 'historical', visitDuration: '2-3 hours', entryFee: '₹25', bestTimeToVisit: 'Morning', location: 'Khandagiri Road, 6km from city center' },
        { name: 'Odisha State Museum', description: 'Rich collection of archaeology, natural history, and tribal artifacts', category: 'cultural', visitDuration: '1-2 hours', entryFee: '₹10', bestTimeToVisit: 'Morning', location: 'Lewis Road, near Secretariat' },
        { name: 'Mukteshwar Temple', description: '10th-century temple with exquisite stone carvings and torana', category: 'spiritual', visitDuration: '1 hour', entryFee: 'Free', bestTimeToVisit: 'Morning', location: 'Old Town area' },
        { name: 'Rajarani Temple', description: 'Sculptural masterpiece known as Love Temple with intricate carvings', category: 'historical', visitDuration: '1 hour', entryFee: '₹15', bestTimeToVisit: 'Sunset', location: 'Near Bhubaneswar Airport' },
        { name: 'Dhauli Peace Pagoda', description: 'Buddhist stupa marking Emperor Ashoka\'s transformation site', category: 'spiritual', visitDuration: '1-2 hours', entryFee: 'Free', bestTimeToVisit: 'Evening', location: 'Dhauli Hills, 8km south' }
      ],
      'Hyderabad': [
        { name: 'Charminar', description: 'Iconic 16th-century monument and symbol of Hyderabad', category: 'historical', visitDuration: '1-2 hours', entryFee: '₹30', bestTimeToVisit: 'Evening', location: 'Charminar Road, Old City' },
        { name: 'Golconda Fort', description: 'Magnificent fortress with acoustic marvels and diamond history', category: 'historical', visitDuration: '3-4 hours', entryFee: '₹30', bestTimeToVisit: 'Morning', location: 'Ibrahim Bagh, Golconda' },
        { name: 'Ramoji Film City', description: 'World\'s largest integrated film studio complex', category: 'entertainment', visitDuration: '8-10 hours', entryFee: '₹1200-2500', bestTimeToVisit: 'Full day', location: 'Abdullahpurmet, Ranga Reddy District' },
        { name: 'Hussain Sagar Lake', description: 'Heart-shaped lake with 58-feet Buddha statue', category: 'natural', visitDuration: '2-3 hours', entryFee: '₹50-200', bestTimeToVisit: 'Evening', location: 'Tank Bund Road' },
        { name: 'Salar Jung Museum', description: 'One of India\'s largest art museums with rare collections', category: 'cultural', visitDuration: '2-3 hours', entryFee: '₹20', bestTimeToVisit: 'Morning', location: 'Salar Jung Road, Darushifa' }
      ],
      'Mumbai': [
        { name: 'Gateway of India', description: 'Iconic arch monument overlooking Mumbai Harbor', category: 'historical', visitDuration: '1-2 hours', entryFee: 'Free', bestTimeToVisit: 'Evening', location: 'Apollo Bunder, Colaba' },
        { name: 'Marine Drive', description: 'Queen\'s Necklace - curved promenade along the coast', category: 'natural', visitDuration: '2-3 hours', entryFee: 'Free', bestTimeToVisit: 'Sunset', location: 'Nariman Point to Babulnath' },
        { name: 'Elephanta Caves', description: 'Ancient rock-cut caves with Lord Shiva sculptures', category: 'historical', visitDuration: '4-5 hours', entryFee: '₹40', bestTimeToVisit: 'Morning', location: 'Elephanta Island (ferry from Gateway)' },
        { name: 'Juhu Beach', description: 'Popular beach with street food and sunset views', category: 'natural', visitDuration: '2-3 hours', entryFee: 'Free', bestTimeToVisit: 'Evening', location: 'Juhu Tara Road, Juhu' },
        { name: 'Crawford Market', description: 'Historic market for fruits, spices, and local goods', category: 'shopping', visitDuration: '1-2 hours', entryFee: 'Free', bestTimeToVisit: 'Morning', location: 'Lokamanya Tilak Marg, Fort' }
      ]
    };

    if (specificAttractions[destination]) {
      return specificAttractions[destination];
    }

    // Generic attractions based on type
    const attractionTemplates = {
      metropolitan: [
        { name: `${destination} City Center`, description: 'Main commercial and cultural hub with shopping and dining', category: 'urban', visitDuration: '2-3 hours', entryFee: 'Free', bestTimeToVisit: 'Evening', location: 'Central business district' },
        { name: 'Local Art Museum', description: 'Regional art and cultural heritage museum', category: 'cultural', visitDuration: '1-2 hours', entryFee: '₹50-200', bestTimeToVisit: 'Morning', location: 'Museum district' },
        { name: 'Historic Temple Complex', description: 'Ancient temples showcasing local architecture', category: 'spiritual', visitDuration: '1-2 hours', entryFee: 'Free-₹50', bestTimeToVisit: 'Early morning', location: 'Old town area' },
        { name: 'Central Market', description: 'Bustling marketplace for local products and street food', category: 'shopping', visitDuration: '2-4 hours', entryFee: 'Free', bestTimeToVisit: 'Evening', location: 'Market district' },
        { name: 'City Gardens', description: 'Public parks and botanical gardens for relaxation', category: 'nature', visitDuration: '1-3 hours', entryFee: 'Free-₹20', bestTimeToVisit: 'Morning', location: 'Green belt area' }
      ],
      heritage: [
        { name: `${destination} Fort`, description: 'Historic fortification with panoramic city views', category: 'historical', visitDuration: '2-4 hours', entryFee: '₹100-500', bestTimeToVisit: 'Morning', location: 'Hill top area' },
        { name: 'Ancient Temple Complex', description: 'Centuries-old temples with intricate stone carvings', category: 'spiritual', visitDuration: '1-2 hours', entryFee: '₹25-100', bestTimeToVisit: 'Early morning', location: 'Temple town area' },
        { name: 'Archaeological Museum', description: 'Artifacts and sculptures from ancient civilizations', category: 'cultural', visitDuration: '1-3 hours', entryFee: '₹50-200', bestTimeToVisit: 'Morning', location: 'Heritage district' },
        { name: 'Royal Palace', description: 'Former royal residence showcasing regal architecture', category: 'historical', visitDuration: '1-2 hours', entryFee: '₹50-150', bestTimeToVisit: 'Any time', location: 'Palace grounds' },
        { name: 'Heritage Walk Route', description: 'Guided walking tour through historic quarters', category: 'cultural', visitDuration: '2-3 hours', entryFee: '₹200-500', bestTimeToVisit: 'Evening', location: 'Old city area' }
      ],
      beach: [
        { name: `${destination} Main Beach`, description: 'Pristine coastline with golden sand and clear waters', category: 'natural', visitDuration: '4-6 hours', entryFee: 'Free', bestTimeToVisit: 'Morning/Evening', location: 'Coastal stretch' },
        { name: 'Water Sports Center', description: 'Adventure activities like jet skiing and parasailing', category: 'adventure', visitDuration: '2-4 hours', entryFee: '₹1000-3000', bestTimeToVisit: 'Morning', location: 'Beach front' },
        { name: 'Coastal Temple', description: 'Seaside shrine with ocean views and sunset prayers', category: 'spiritual', visitDuration: '1-2 hours', entryFee: 'Free', bestTimeToVisit: 'Sunset', location: 'Rocky coastline' },
        { name: 'Fishing Harbor', description: 'Traditional fishing village with fresh seafood', category: 'cultural', visitDuration: '2-3 hours', entryFee: 'Free', bestTimeToVisit: 'Early morning', location: 'Harbor area' },
        { name: 'Lighthouse', description: 'Historic beacon with panoramic coastal views', category: 'historical', visitDuration: '1 hour', entryFee: '₹30-100', bestTimeToVisit: 'Sunset', location: 'Headland point' }
      ],
      mountain: [
        { name: `${destination} Peak Viewpoint`, description: 'Breathtaking panoramic views of valleys and peaks', category: 'natural', visitDuration: '2-4 hours', entryFee: 'Free-₹50', bestTimeToVisit: 'Sunrise/Sunset', location: 'Highest accessible point' },
        { name: 'Nature Trails', description: 'Well-marked hiking paths through forest and meadows', category: 'adventure', visitDuration: '3-6 hours', entryFee: 'Free-₹100', bestTimeToVisit: 'Morning', location: 'Forest reserve area' },
        { name: 'Alpine Gardens', description: 'High-altitude botanical gardens with rare flora', category: 'nature', visitDuration: '1-3 hours', entryFee: '₹30-100', bestTimeToVisit: 'Morning', location: 'Garden district' },
        { name: 'Cable Car Station', description: 'Scenic aerial ride with mountain valley views', category: 'adventure', visitDuration: '1-2 hours', entryFee: '₹200-800', bestTimeToVisit: 'Clear weather', location: 'Valley base station' },
        { name: 'Hill Station Temple', description: 'Serene mountain shrine with spiritual ambiance', category: 'spiritual', visitDuration: '1-2 hours', entryFee: 'Free', bestTimeToVisit: 'Early morning', location: 'Temple hill' }
      ]
    };
    
    return attractionTemplates[type] || attractionTemplates.metropolitan;
  }

  generateSmartActivities(type, userInterests, age) {
    const baseActivities = {
      metropolitan: [
        { name: 'Heritage Walking Tour', description: 'Guided exploration of historic neighborhoods and monuments', duration: '3-4 hours', cost: '₹300-800', difficulty: 'easy', ageAppropriate: true, location: 'Old city area' },
        { name: 'Street Food Safari', description: 'Culinary journey through local markets and food streets', duration: '2-4 hours', cost: '₹500-1500', difficulty: 'easy', ageAppropriate: true, location: 'Food districts' },
        { name: 'Local Market Experience', description: 'Shopping tour of traditional bazaars and modern malls', duration: '2-6 hours', cost: '₹500-5000', difficulty: 'easy', ageAppropriate: true, location: 'Shopping areas' },
        { name: 'Cultural Performance', description: 'Traditional music, dance, and theater shows', duration: '1-2 hours', cost: '₹200-1000', difficulty: 'easy', ageAppropriate: age < 70, location: 'Cultural centers' },
        { name: 'Photography Workshop', description: 'Capture city\'s essence with professional guidance', duration: '2-4 hours', cost: '₹800-2000', difficulty: 'easy', ageAppropriate: true, location: 'Scenic spots' }
      ],
      heritage: [
        { name: 'Archaeological Site Tour', description: 'Expert-guided exploration of ancient ruins and monuments', duration: '2-4 hours', cost: '₹200-500', difficulty: 'easy', ageAppropriate: true, location: 'Heritage sites' },
        { name: 'Traditional Craft Workshop', description: 'Learn local handicrafts from master artisans', duration: '2-4 hours', cost: '₹500-2000', difficulty: 'moderate', ageAppropriate: age < 65, location: 'Craft centers' },
        { name: 'Historical Storytelling Tour', description: 'Immersive tales of ancient legends and history', duration: '2-3 hours', cost: '₹300-800', difficulty: 'easy', ageAppropriate: age < 75, location: 'Historic quarters' },
        { name: 'Heritage Photography', description: 'Capture architectural marvels with professional tips', duration: '1-3 hours', cost: '₹100-400', difficulty: 'easy', ageAppropriate: true, location: 'Monument areas' },
        { name: 'Cultural Immersion Program', description: 'Traditional ceremonies and local customs experience', duration: '1-2 hours', cost: '₹300-1200', difficulty: 'easy', ageAppropriate: true, location: 'Cultural venues' }
      ],
      beach: [
        { name: 'Water Sports Adventure', description: 'Jet skiing, parasailing, and banana boat rides', duration: '2-4 hours', cost: '₹1000-4000', difficulty: 'moderate', ageAppropriate: age < 60, location: 'Beach sports center' },
        { name: 'Beach Games Tournament', description: 'Volleyball, frisbee, and other fun beach activities', duration: '1-2 hours', cost: '₹200-500', difficulty: 'moderate', ageAppropriate: age < 50, location: 'Beach recreation area' },
        { name: 'Sunset Sailing', description: 'Peaceful boat cruise during golden hour', duration: '2-3 hours', cost: '₹800-2500', difficulty: 'easy', ageAppropriate: true, location: 'Harbor marina' },
        { name: 'Fishing Experience', description: 'Traditional or deep-sea fishing with locals', duration: '3-5 hours', cost: '₹1500-3000', difficulty: 'easy', ageAppropriate: age < 70, location: 'Fishing docks' },
        { name: 'Coastal Photography', description: 'Capture stunning seascapes and marine life', duration: '2-4 hours', cost: '₹500-1500', difficulty: 'easy', ageAppropriate: true, location: 'Scenic coastline' }
      ],
      mountain: [
        { name: 'Guided Trek', description: 'Nature walks through forest trails with mountain guides', duration: '4-8 hours', cost: '₹800-2500', difficulty: 'moderate', ageAppropriate: age < 65, location: 'Mountain trails' },
        { name: 'Cable Car Adventure', description: 'Scenic aerial journey with valley views', duration: '1-2 hours', cost: '₹300-800', difficulty: 'easy', ageAppropriate: true, location: 'Cable car station' },
        { name: 'Mountain Biking', description: 'Cycling through scenic mountain roads and trails', duration: '2-5 hours', cost: '₹800-2000', difficulty: 'moderate', ageAppropriate: age < 55, location: 'Mountain roads' },
        { name: 'Nature Photography', description: 'Capture mountain landscapes and wildlife', duration: '3-6 hours', cost: '₹500-1500', difficulty: 'easy', ageAppropriate: true, location: 'Scenic viewpoints' },
        { name: 'Sunrise Expedition', description: 'Early morning trek to witness spectacular sunrise', duration: '2-3 hours', cost: '₹500-1500', difficulty: 'easy', ageAppropriate: true, location: 'Peak viewpoints' }
      ]
    };
    
    return baseActivities[type] || baseActivities.metropolitan;
  }

  generateSmartCuisine(destination, region) {
    // Enhanced cuisine database with specific restaurants
    const regionCuisines = {
      'Odisha': [
        { dish: 'Chhena Poda', description: 'Caramelized cottage cheese dessert, signature sweet of Odisha', restaurants: 'Bikalananda Kar Sweet Shop, Pahala Rajbhog', price: '₹200-400 per kg', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Dalma', description: 'Traditional lentil curry with mixed vegetables and aromatic spices', restaurants: 'Hare Krishna Restaurant, Kanika Restaurant', price: '₹80-150', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Machha Jhola', description: 'Spicy fish curry with mustard oil, quintessential Odia dish', restaurants: 'Bhojohori Manna, Dalma Restaurant', price: '₹150-300', mustTry: true, dietaryInfo: 'Non-vegetarian' },
        { dish: 'Pitha Platter', description: 'Variety of rice cakes in sweet and savory forms', restaurants: 'Local homes during festivals, Hotel Mayfair', price: '₹100-250', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Rasgulla', description: 'Soft, spongy cheese balls in sugar syrup, originated in Odisha', restaurants: 'Balaram Mullick & Radharaman Mullick Sweets', price: '₹200-400 per kg', mustTry: true, dietaryInfo: 'Vegetarian' }
      ],
      'Telangana': [
        { dish: 'Hyderabadi Biryani', description: 'Aromatic basmati rice layered with marinated meat and spices', restaurants: 'Paradise Biryani, Bawarchi', price: '₹250-500', mustTry: true, dietaryInfo: 'Non-vegetarian' },
        { dish: 'Haleem', description: 'Slow-cooked stew of meat, lentils, and wheat, popular during Ramadan', restaurants: 'Pista House, Shah Ghouse Cafe', price: '₹150-300', mustTry: true, dietaryInfo: 'Non-vegetarian' },
        { dish: 'Mirchi Ka Salan', description: 'Spicy chili curry in a tangy peanut and sesame sauce', restaurants: 'Shah Ghouse Cafe, Cafe Bahar', price: '₹100-200', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Double Ka Meetha', description: 'Bread pudding dessert with saffron and dry fruits', restaurants: 'Hotel Shadab, Cafe Bahar', price: '₹80-150', mustTry: true, dietaryInfo: 'Vegetarian' }, 
        { dish: 'Pesarattu', description: 'Green gram crepe served with ginger chutney', restaurants: 'Chutneys, Minerva Coffee Shop', price: '₹50-100', mustTry: false, dietaryInfo: 'Vegetarian' }
      ],
      'Maharashtra': [
        { dish: 'Vada Pav', description: 'Spicy potato fritter in a bun, Mumbai\'s iconic street food', restaurants: 'Ashok Vada Pav, Shivaji Vada Pav', price: '₹20-50', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Pav Bhaji', description: 'Spiced vegetable mash served with buttered bread rolls', restaurants: 'Sardar Pav Bhaji, Canon Pav Bhaji', price: '₹100-200', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Misal Pav', description: 'Spicy sprouted lentil curry topped with farsan and served with pav', restaurants: 'Aaswad, Mamledar Misal', price: '₹100-200', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Bombay Sandwich', description: 'Multi-layered vegetable sandwich with mint chutney', restaurants: 'Kailash Parbat, Cafe Excelsior', price: '₹50-150', mustTry: false, dietaryInfo: 'Vegetarian' },
        { dish: 'Modak', description: 'Sweet dumplings filled with coconut and jaggery, favorite of Lord Ganesha', restaurants: 'Chitale Bandhu Mithaiwale, Sweet Bengal', price: '₹200-400 per dozen', mustTry: true, dietaryInfo: 'Vegetarian' }    
      ],
      'Tamil Nadu': [
        { dish: 'Dosa', description: 'Crispy fermented rice crepe, staple South Indian breakfast', restaurants: 'Sangeetha, Murugan Idli Shop', price: '₹50-150', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Idli', description: 'Steamed rice cakes served with sambar and chutneys', restaurants: 'Murugan Idli Shop, Ratna Cafe', price: '₹30-100', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Chettinad Chicken', description: 'Spicy chicken curry with aromatic Chettinad spices', restaurants: 'Anjappar, Buhari Hotel', price: '₹150-300', mustTry: true, dietaryInfo: 'Non-vegetarian' },
        { dish: 'Pongal', description: 'Comforting rice and lentil dish flavored with black pepper and cumin', restaurants: 'Sangeetha, Murugan Idli Shop', price: '₹50-150', mustTry: false, dietaryInfo: 'Vegetarian' },  
        { dish: 'Filter Coffee', description: 'Strong South Indian coffee brewed with chicory and milk', restaurants: 'Cafe Coffee Day, Saravana Bhavan', price: '₹20-100', mustTry: true, dietaryInfo: 'Vegetarian' }
      ],
      'Karnataka': [
        { dish: 'Bisi Bele Bath', description: 'Spicy rice and lentil dish with vegetables and tamarind', restaurants: 'MTR, Vidyarthi Bhavan', price: '₹100-200', mustTry: true, dietaryInfo: 'Vegetarian' },    
        { dish: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato masala', restaurants: 'Vidyarthi Bhavan, CTR', price: '₹50-150', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Ragi Mudde', description: 'Finger millet balls served with spicy sambar or curry', restaurants: 'Local eateries in rural areas', price: '₹50-100', mustTry: false, dietaryInfo: 'Vegetarian' },
        { dish: 'Mysore Pak', description: 'Rich sweet made from ghee, sugar, and gram flour', restaurants: 'Guru Sweets, MTR', price: '₹200-400 per kg', mustTry: true, dietaryInfo: 'Vegetarian' }, 
        { dish: 'Coorgi Pandi Curry', description: 'Spicy pork curry from Coorg region', restaurants: 'Coorgi Kitchen, Raintree', price: '₹200-400', mustTry: true, dietaryInfo: 'Non-vegetarian' }
      ],
      'West Bengal': [
        { dish: 'Rasgulla', description: 'Soft, spongy cheese balls in sugar syrup, originated in Bengal', restaurants: 'K.C. Das, Balaram Mullick & Radharaman Mullick', price: '₹200-400 per kg', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Sandesh', description: 'Delicate sweet made from fresh paneer and sugar', restaurants: 'K.C. Das, Bhim Chandra Nag', price: '₹150-300 per kg', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Mishti Doi', description: 'Sweetened fermented yogurt, a traditional Bengali dessert', restaurants: 'K.C. Das, Balaram Mullick & Radharaman Mullick', price: '₹50-150', mustTry: true, dietaryInfo: 'Vegetarian' },
        { dish: 'Shorshe Ilish', description: 'Hilsa fish cooked in mustard gravy, quintessential Bengali dish', restaurants: '6 Ballygunge Place, Oh! Calcutta', price: '₹300-600', mustTry: true, dietaryInfo: 'Non-vegetarian' }, 
        { dish: 'Chingri Malai Curry', description: 'Prawns cooked in coconut milk with aromatic spices', restaurants: 'Bhojohori Manna, Oh! Calcutta', price: '₹400-800', mustTry: true, dietaryInfo: 'Non-vegetarian' }
      ]
    };  
    
    return regionCuisines[region] || [
      { dish: 'Local Specialty Dish', description: `Famous traditional dish from ${destination}`, restaurants: 'Top local restaurants', price: '₹100-500', mustTry: true, dietaryInfo: 'Varies' },
      { dish: 'Popular Street Food', description: 'Must-try street food item', restaurants: 'Famous street vendors', price: '₹20-100', mustTry: true, dietaryInfo: 'Varies' },
      { dish: 'Traditional Sweet', description: 'Renowned local dessert', restaurants: 'Well-known sweet shops', price: '₹100-300', mustTry: true, dietaryInfo: 'Vegetarian' },
      { dish: 'Signature Beverage', description: 'Popular local drink or refreshment', restaurants: 'Cafes and eateries', price: '₹30-150', mustTry: false, dietaryInfo: 'Varies' },
      { dish: 'Vegetarian Delight', description: 'Famous vegetarian dish', restaurants: 'Top vegetarian restaurants', price: '₹100-300', mustTry: false, dietaryInfo: 'Vegetarian' }
    ];
  }   
  generateShoppingRecommendations(destination, region) {    
    // Enhanced shopping database with specific markets and items 
    const regionShopping = {
      'Odisha': [ 
        { market: 'Handloom Market', description: 'Traditional handwoven textiles including Sambalpuri sarees and ikat fabrics', popularItems: 'Sarees, dupattas, dress materials', location: 'Unit-III, Bhubaneswar', operatingHours: '10 AM - 7 PM', bestTimeToVisit: 'Afternoon', tips: 'Bargain for better prices' },
        { market: 'Tribal Handicrafts Market', description: 'Unique tribal crafts like dokra metalwork and terracotta items', popularItems: 'Metal artifacts, pottery, jewelry', location: 'Tribal Museum area, Bhubaneswar', operatingHours: '10 AM - 6 PM', bestTimeToVisit: 'Morning', tips: 'Look for authentic tribal designs' },
        { market: 'Puri Market', description: 'Vibrant market near Jagannath Temple with religious items and souvenirs', popularItems: 'Religious idols, conch shells, textiles', location: 'Near Jagannath Temple, Puri', operatingHours: '9 AM - 8 PM', bestTimeToVisit: 'Evening', tips: 'Ideal for temple-related purchases' },
        { market: 'Cuttack Silver Filigree Market', description: 'Famous for intricate silver filigree jewelry and decorative items', popularItems: 'Silver jewelry, home decor', location: 'Cuttack city center', operatingHours: '10 AM - 6 PM', bestTimeToVisit: 'Afternoon', tips: 'Check for craftsmanship quality' }, 
        { market: 'Raghurajpur Artist Village', description: 'Living heritage village known for Pattachitra paintings and crafts', popularItems: 'Pattachitra art, masks, dolls', location: 'Raghurajpur, near Puri', operatingHours: '10 AM - 5 PM', bestTimeToVisit: 'Morning', tips: 'Visit artist workshops for unique pieces' }  
      ],  
      'Telangana': [  
        { market: 'Laad Bazaar', description: 'Famous for traditional bangles, pearls, and bridal jewelry', popularItems: 'Bangles, pearls, jewelry', location: 'Near Charminar, Hyderabad', operatingHours: '10 AM - 9 PM', bestTimeToVisit: 'Evening', tips: 'Bargain for better deals' },
        { market: 'Shilparamam', description: 'Cultural village showcasing handicrafts from across India', popularItems: 'Handicrafts, textiles, jewelry', location: 'Hitech City, Hyderabad', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Afternoon', tips: 'Great for souvenirs and gifts' }, 
        { market: 'Koti Sultan Bazaar', description: 'Bustling market for clothes, accessories, and household items', popularItems: 'Clothing, accessories, home goods', location: 'Koti area, Hyderabad', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Morning', tips: 'Explore side lanes for unique finds' }, 
        { market: 'Begum Bazaar', description: 'One of the largest wholesale markets for spices, dry fruits, and household items', popularItems: 'Spices, dry fruits, kitchenware', location: 'Near Charminar, Hyderabad', operatingHours: '9 AM - 7 PM', bestTimeToVisit: 'Morning', tips: 'Ideal for bulk purchases' }, 
        { market: 'Jubilee Hills Road No. 36', description: 'Upscale shopping area with boutiques and designer stores', popularItems: 'Designer clothing, accessories', location: 'Jubilee Hills, Hyderabad', operatingHours: '11 AM - 9 PM', bestTimeToVisit: 'Afternoon', tips: 'Perfect for high-end shopping' } 
      ],
      'Maharashtra': [
        { market: 'Colaba Causeway', description: 'Popular street market for fashion, accessories, and souvenirs', popularItems: 'Clothing, jewelry, handicrafts', location: 'Colaba, Mumbai', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Morning', tips: 'Bargain for better prices' },
        { market: 'Crawford Market', description: 'Historic market for fresh produce, spices, and household items', popularItems: 'Fruits, vegetables, spices', location: 'Fort area, Mumbai', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Morning', tips: 'Great for local food items' },  
        { market: 'Fashion Street', description: 'Street market with trendy clothing and accessories at affordable prices', popularItems: 'Clothing, accessories', location: 'MG Road, Mumbai', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Afternoon', tips: 'Ideal for budget shopping' },  
        { market: 'Chor Bazaar', description: 'Famous flea market for antiques, vintage items, and curios', popularItems: 'Antiques, vintage goods', location: 'Mahalaxmi area, Mumbai', operatingHours: '11 AM - 7 PM', bestTimeToVisit: 'Morning', tips: 'Haggle for best deals' },  
        { market: 'Pune Central Mall', description: 'Modern shopping mall with national and international brands', popularItems: 'Branded clothing, electronics', location: 'FC Road, Pune', operatingHours: '10 AM - 10 PM', bestTimeToVisit: 'Evening', tips: 'Look for seasonal sales' }  
      ],
      'Tamil Nadu': [
        { market: 'T. Nagar Market', description: 'Bustling shopping district known for silk sarees and gold jewelry', popularItems: 'Silk sarees, gold jewelry', location: 'Thyagaraya Nagar, Chennai', operatingHours: '10 AM - 9 PM', bestTimeToVisit: 'Morning', tips: 'Bargain for better prices' },
        { market: 'Pondy Bazaar', description: 'Vibrant street market for clothing, accessories, and street food', popularItems: 'Clothing, accessories, street food', location: 'Pondy Bazaar, Chennai', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Afternoon', tips: 'Explore side lanes for unique finds' },
        { market: 'Chennai Silks', description: 'Famous store for silk sarees and traditional attire', popularItems: 'Sil k sarees, dress materials', location: 'Multiple locations in Chennai', operatingHours: '10 AM - 9 PM', bestTimeToVisit: 'Any time', tips: 'Check for festive collections' },  
        { market: 'Kanchipuram Handloom Market', description: 'Renowned for authentic Kanchipuram silk sarees', popularItems: 'Kanchipuram sarees, silk fabrics', location: 'Kanchipuram town', operatingHours: '10 AM - 6 PM', bestTimeToVisit: 'Morning', tips: 'Buy from reputed stores for authenticity' }, 
        { market: 'Ranganathan Street', description: 'Famous shopping street for clothes, accessories, and electronics', popularItems: 'Clothing, accessories, electronics', location: 'T. Nagar, Chennai', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Afternoon', tips: 'Ideal for budget shopping' }  
      ],
      'Karnataka': [
        { market: 'Commercial Street', description: 'Popular shopping area for clothing, accessories, and footwear', popularItems: 'Clothing, shoes, accessories', location: 'Bangalore city center', operatingHours: '10 AM - 9 PM', bestTimeToVisit: 'Morning', tips: 'Bargain for better deals' },
        { market: 'Chickpet Market', description: 'Historic market known for silk sarees and traditional textiles', popularItems: 'Silk sarees, fabrics', location: 'Chickpet area, Bangalore', operatingHours: '10 AM - 7 PM', bestTimeToVisit: 'Morning', tips: 'Look for authentic silk products' }, 
        { market: 'Brigade Road', description: 'Trendy shopping street with branded stores and eateries', popularItems: 'Branded clothing, accessories', location: 'Bangalore city center', operatingHours: '10 AM - 9 PM', bestTimeToVisit: 'Afternoon', tips: 'Great for youth fashion' },  
        { market: 'Mysore Silk Market', description: 'Famous for Mysore silk sarees and garments', popularItems: 'Mysore silk sarees, dress materials', location: 'Mysore city center', operatingHours: '10 AM - 6 PM', bestTimeToVisit: 'Morning', tips: 'Buy from authorized dealers' },  
        { market: 'UB City Mall', description: 'Luxury shopping mall with high-end brands and fine dining', popularItems: 'Designer clothing, accessories', location: 'Bangalore city center', operatingHours: '10 AM - 10 PM', bestTimeToVisit: 'Evening', tips: 'Look for seasonal sales' } 
      ],  
      'West Bengal': [  
        { market: 'New Market', description: 'Historic market for clothing, accessories, and street food', popularItems: 'Clothing, jewelry, handicrafts', location: 'Esplanade area, Kolkata', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Morning', tips: 'Bargain for better prices' },    
        { market: 'Gariahat Market', description: 'Popular shopping area for sarees, jewelry, and home decor', popularItems: 'Sarees, jewelry, home decor', location: 'Gariahat area, Kolkata', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Afternoon', tips: 'Explore side lanes for unique finds' },  
        { market: 'Dakshinapan Shopping Complex', description: 'Cultural complex showcasing handicrafts from across India', popularItems: 'Handicrafts, textiles, jewelry', location: 'Dakshinapan area, Kolkata', operatingHours: '10 AM - 7 PM', bestTimeToVisit: 'Afternoon', tips: 'Great for souvenirs and gifts' }, 
        { market: 'College Street', description: 'Famous for bookstores and literary shops', popularItems: 'Books, stationery', location: 'College Street area, Kolkata', operatingHours: '10 AM - 6 PM', bestTimeToVisit: 'Morning', tips: 'Ideal for book lovers' },  
        { market: 'South City Mall', description: 'Modern shopping mall with national and international brands', popularItems: 'Branded clothing, electronics', location: 'South City area, Kolkata', operatingHours: '10 AM - 10 PM', bestTimeToVisit: 'Evening', tips: 'Look for seasonal sales' }  
      ]  
    };
    return regionShopping[region] || [
      { market: 'Local Handicraft Market', description: `Market known for traditional crafts and souvenirs from ${destination}`, popularItems: 'Handicrafts, textiles, jewelry', location: 'Central market area', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Morning', tips: 'Bargain for better prices' },
      { market: 'Street Shopping Area', description: 'Vibrant street market for clothing, accessories, and street food', popularItems: 'Clothing, accessories, street food', location: 'Popular shopping street', operatingHours: '10 AM - 8 PM', bestTimeToVisit: 'Afternoon', tips: 'Explore side lanes for unique finds' },
      { market: 'Modern Shopping Mall', description: 'Contemporary mall with branded stores and eateries', popularItems: 'Branded clothing, electronics', location: 'City center', operatingHours: '10 AM - 10 PM', bestTimeToVisit: 'Evening', tips: 'Look for seasonal sales' },    
      { market: 'Antique and Curio Market', description: 'Flea market for antiques, vintage items, and curios', popularItems: 'Antiques, vintage goods', location: 'Historic market area', operatingHours: '11 AM - 7 PM', bestTimeToVisit: 'Morning', tips: 'Haggle for best deals' },
      { market: 'Cultural Handicraft Complex', description: 'Cultural complex showcasing handicrafts from various regions', popularItems: 'Handicrafts, textiles, jewelry', location: 'Cultural district', operatingHours: '10 AM - 7 PM', bestTimeToVisit: 'Afternoon', tips: 'Great for souvenirs and gifts' }
    ];
  }

  generateSmartItinerary(days, destinationInfo, userData) {
    const itinerary = [];
    const attractions = this.generateSmartAttractions(userData.destination, destinationInfo.type);
    const activities = this.generateSmartActivities(destinationInfo.type, userData.activities, userData.age);
    const cuisine = this.generateSmartCuisine(userData.destination, destinationInfo.region);
    
    for (let day = 1; day <= days; day++) {
      if (day === 1) {
        itinerary.push({
          day: 1,
          theme: 'Arrival and First Impressions',
          morning: `Arrive in ${userData.destination}, check into hotel, freshen up and light breakfast`,
          afternoon: `Explore ${attractions[0]?.name || 'city center'} and have lunch at ${cuisine[0]?.restaurants?.split(',')[0] || 'local restaurant'}`,
          evening: `Evening stroll at ${attractions[1]?.name || 'main market area'} and welcome dinner`,
          meals: {
            breakfast: 'Hotel breakfast or local cafe',
            lunch: cuisine[0]?.restaurants?.split(',')[0] || 'Traditional local restaurant',
            dinner: cuisine[1]?.restaurants?.split(',')[0] || 'Popular local eatery'
          },
          accommodation: `Check into ${userData.hotel || 'standard'} hotel in city center`,
          transportation: 'Airport/station to hotel by taxi or pre-booked cab',
          tips: 'Rest well after travel, stay hydrated, get local SIM card, keep hotel address handy',
          estimatedCost: '₹1500-3000'
        });
      } else if (day === days) {
        itinerary.push({
          day: days,
          theme: 'Final Exploration and Departure',
          morning: `Visit ${attractions[Math.min(day-1, attractions.length-1)]?.name || 'final attraction'}, pack and check out`,
          afternoon: `Last-minute shopping at ${attractions.find(a => a.category === 'shopping')?.name || 'local market'}, departure preparations`,
          evening: 'Safe journey back home',
          meals: {
            breakfast: 'Hotel breakfast',
            lunch: 'Quick meal at food court or airport',
            dinner: 'Travel meal or home'
          },
          accommodation: 'Check out from hotel',
          transportation: 'Hotel to departure point by taxi',
          tips: 'Keep important documents ready, arrive early at station/airport, pack souvenirs carefully',
          estimatedCost: '₹800-1500'
        });
      } else {
        const activityIndex = (day - 2) % activities.length;
        const attractionIndex = (day - 1) % attractions.length;
        const cuisineIndex = (day - 1) % cuisine.length;
        const restaurantRotation = Math.floor((day - 2) / cuisine.length);
        
        itinerary.push({
          day: day,
          theme: `Cultural Immersion Day ${day - 1}`,
          morning: `Start with ${activities[activityIndex]?.name || 'morning activity'} at ${activities[activityIndex]?.location || 'city area'}`,
          afternoon: `Visit ${attractions[attractionIndex]?.name || 'major attraction'} and explore ${attractions[attractionIndex]?.location || 'surrounding area'}`,
          evening: `${day % 2 === 0 ? `Sunset at ${attractions[(attractionIndex + 1) % attractions.length]?.name || 'scenic spot'}` : 'Leisure time and local market exploration'}`,
          meals: {
            breakfast: day % 3 === 1 ? 'Hotel restaurant' : day % 3 === 2 ? 'Local breakfast joint' : 'Cafe hopping',
            lunch: cuisine[cuisineIndex]?.restaurants?.split(',')[restaurantRotation % (cuisine[cuisineIndex]?.restaurants?.split(',').length || 1)] || 'Traditional restaurant',
            dinner: cuisine[(cuisineIndex + 1) % cuisine.length]?.restaurants?.split(',')[0] || 'Popular dinner spot'
          },
          accommodation: `Continue stay at ${userData.hotel || 'standard'} hotel`,
          transportation: 'Local transport - auto, taxi, or walking depending on distance',
          tips: 'Start early to avoid crowds, wear comfortable shoes, carry water and snacks, respect local customs',
          estimatedCost: '₹2000-4500'
        });
      }
    }
    
    return itinerary;
  }

  calculateSmartBudget(days, people, hotelType, transport, destinationType) {
    const baseCosts = {
      metropolitan: { budget: 2500, standard: 4200, luxury: 7500 },
      heritage: { budget: 2000, standard: 3500, luxury: 6000 },
      beach: { budget: 2200, standard: 3800, luxury: 6800 },
      mountain: { budget: 1800, standard: 3200, luxury: 5500 },
      adventure: { budget: 2300, standard: 4000, luxury: 6500 },
      modern: { budget: 3000, standard: 5000, luxury: 8000 },
      general: { budget: 2200, standard: 3800, luxury: 6200 }
    };
    
    const transportCosts = { 
      flight: 8000, 
      train: 1500, 
      bus: 800 
    };
    
    const dailyCostStructure = baseCosts[destinationType] || baseCosts.general;
    const selectedDailyCost = dailyCostStructure[hotelType] || dailyCostStructure.standard;
    
    const accommodation = Math.round(selectedDailyCost * 0.35 * days * people);
    const food = Math.round(selectedDailyCost * 0.30 * days * people);
    const activities = Math.round(selectedDailyCost * 0.25 * days * people);
    const transportCost = transportCosts[transport] * people;
    const shopping = Math.round(selectedDailyCost * 0.10 * days * people);
    
    return {
      accommodation,
      food,
      activities,
      transport: transportCost,
      shopping,
      total: accommodation + food + activities + transportCost + shopping,
      breakdown: `Budget allocated as: Accommodation (35%), Food (30%), Activities (25%), Transport (${transport}), Shopping (10%)`
    };
  }

  generateSmartTips(destinationInfo, transport, age) {
    const baseTips = [
      `Best time to visit ${destinationInfo.region}: ${destinationInfo.bestTime}`,
      `Local currency: ${destinationInfo.currency}`,
      `Languages spoken: ${destinationInfo.language}`,
      'Download offline maps (Google Maps/Maps.me) before traveling',
      'Keep digital and physical copies of important documents',
      'Inform your bank about travel dates to avoid card blocks'
    ];
    
    // Transport-specific tips
    if (transport === 'flight') {
      baseTips.push('Check baggage restrictions and arrive 2-3 hours early for domestic flights');
      baseTips.push('Download airline app for mobile check-in and real-time updates');
    } else if (transport === 'train') {
      baseTips.push('Book train tickets in advance, download IRCTC app for easy booking');
      baseTips.push('Carry snacks, water, and entertainment for long train journeys');
    } else if (transport === 'bus') {
      baseTips.push('Choose government or reputable private bus operators');
      baseTips.push('Book window seats for better views, carry motion sickness medication');
    }
    
    // Age-specific tips
    if (age > 60) {
      baseTips.push('Consider comprehensive travel insurance for seniors');
      baseTips.push('Pack all regular medications with extra quantity');
      baseTips.push('Keep emergency medical contacts and nearby hospital information');
    } else if (age < 25) {
      baseTips.push('Look for hostels and budget accommodations for cost savings');
      baseTips.push('Use travel apps for discounts and connecting with fellow travelers');
    }
    
    // Destination-specific tips
    if (destinationInfo.type === 'mountain') {
      baseTips.push('Pack warm clothes even in summer, mountain temperatures drop at night');
      baseTips.push('Acclimatize gradually if going to high altitude destinations');
    } else if (destinationInfo.type === 'beach') {
      baseTips.push('Pack sunscreen (SPF 30+), hats, and light cotton clothes');
      baseTips.push('Check weather conditions and water safety before swimming');
    } else if (destinationInfo.type === 'heritage') {
      baseTips.push('Research historical significance beforehand for better appreciation');
      baseTips.push('Respect photography rules at monuments and religious sites');
    }
    
    baseTips.push('Keep both cash and cards, some places may not accept digital payments');
    baseTips.push('Save important numbers: hotel, local emergency, travel insurance');
    baseTips.push('Respect local customs and dress codes, especially at religious sites');
    
    return baseTips;
  }

  generateEmergencyInfo(country) {
    const emergencyContacts = {
      'India': { police: '100', medical: '108', fire: '101', tourist: '1363', women: '1091' },
      'France': { police: '17', medical: '15', fire: '18', european: '112' },
      'UK': { police: '999', medical: '999', fire: '999', non_emergency: '101' },
      'Japan': { police: '110', medical: '119', fire: '119', tourist: '050-3816-2787' },
      'UAE': { police: '999', medical: '998', fire: '997', tourist: '800-424' },
      'Thailand': { police: '191', medical: '1669', fire: '199', tourist: '1672' }
    };
    
    const contacts = emergencyContacts[country] || { police: 'Local police', medical: 'Local emergency', fire: 'Fire department' };
    
    return {
      contacts: contacts,
      hospitals: 'Locate nearest hospitals through hotel concierge, Google Maps, or local directories',
      embassy: country !== 'India' ? 'Contact Indian embassy/consulate for assistance while abroad' : 'Not applicable for domestic travel',
      precautions: 'Keep emergency contacts saved in phone, inform family about travel plans, carry travel insurance documents'
    };
  }

  getCurrentSeasonInfo(type) {
    const currentMonth = new Date().getMonth() + 1;
    
    if (currentMonth >= 3 && currentMonth <= 5) {
      return type === 'mountain' ? 'Spring - Pleasant weather, ideal for sightseeing and outdoor activities' : 'Summer - Hot weather, carry light clothes, stay hydrated, plan indoor activities during peak hours';
    }
    if (currentMonth >= 6 && currentMonth <= 9) {
      return 'Monsoon - Rainy season, carry umbrella and waterproof gear, check weather updates, some outdoor activities may be restricted';
    }
    if (currentMonth >= 10 && currentMonth <= 11) {
      return 'Post-monsoon - Pleasant weather, ideal for travel and all outdoor activities, perfect time for sightseeing';
    }
    return 'Winter - Cool to cold weather, carry warm clothes especially for evenings, great weather for exploring';
  }

  getTimeZone(country) {
    const timeZones = {
      'India': 'IST (UTC+5:30)',
      'France': 'CET (UTC+1)',
      'UK': 'GMT (UTC+0)',
      'Japan': 'JST (UTC+9)',
      'UAE': 'GST (UTC+4)',
      'Thailand': 'ICT (UTC+7)',
      'Singapore': 'SGT (UTC+8)',
      'USA': 'Multiple zones (UTC-5 to UTC-8)'
    };
    
    return timeZones[country] || 'Check local time zone information';
  }

  generateAccommodationOptions(type) {
    return {
      budget: 'Budget hotels, hostels, guesthouses (₹800-2000 per night per room)',
      standard: 'Mid-range hotels, service apartments (₹2500-5000 per night per room)',
      luxury: 'Luxury hotels, resorts, heritage properties (₹6000+ per night per room)',
      areas: type === 'beach' ? 'Near beach areas for ocean views' : type === 'heritage' ? 'Old city or near monuments' : type === 'mountain' ? 'Hill station center or valley views' : 'City center for easy access to attractions'
    };
  }

  generateTransportOptions(type) {
    return {
      toDestination: {
        flight: 'Fastest option, book 2-3 weeks in advance for better deals',
        train: 'Economical and comfortable, book 4 months in advance when booking opens',
        bus: 'Most budget-friendly, choose AC sleeper for long distances'
      },
      local: type === 'metropolitan' ? 'Metro, buses, taxis, auto-rickshaws, app-based cabs (Uber/Ola)' : type === 'heritage' ? 'Local buses, cycle rickshaws, walking tours, hired cars' : type === 'mountain' ? 'Local taxis, shared jeeps, some areas accessible only by foot' : 'Local buses, auto-rickshaws, rental bikes/cars'
    };
  }
}

// Enhanced UI Display Function for AI responses
function displayAITripPlan(planData, userData) {
  const hasAIContent = planData.metadata && planData.metadata.source !== 'offline';
  
  const tripPlanHTML = `
    <div style="max-width: 1000px; margin: 20px auto; padding: 20px; background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
      
      <!-- Header Section -->
      <div style="text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, ${hasAIContent ? '#667eea 0%, #764ba2 100%' : '#28a745 0%, #20c997 100%'}); border-radius: 15px; color: white;">
        <h1 style="margin: 0 0 10px 0; font-size: 32px;">🌍 ${planData.destination.name}</h1>
        <p style="margin: 0; font-size: 18px; opacity: 0.9;">${planData.destination.description}</p>
        <div style="margin-top: 15px; font-size: 14px; opacity: 0.8;">
          ${hasAIContent ? '🤖 Generated by AI' : '🧠 Smart Template'} | ${planData.metadata?.generatedAt ? new Date(planData.metadata.generatedAt).toLocaleString() : 'Just now'}
        </div>
      </div>

      <!-- Trip Overview -->
      <div style="background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="color: #004080; margin-top: 0;">📋 Trip Overview</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
          <div><strong>👤 Traveler:</strong> ${userData.name} (${userData.age} years old)</div>
          <div><strong>🎯 Destination:</strong> ${planData.destination.name}, ${planData.destination.region}</div>
          <div><strong>📅 Duration:</strong> ${userData.days} days</div>
          <div><strong>👥 Group Size:</strong> ${userData.people} people</div>
          <div><strong>🚗 Transportation:</strong> ${userData.transport.charAt(0).toUpperCase() + userData.transport.slice(1)}</div>
          <div><strong>🏨 Accommodation:</strong> ${userData.hotel ? userData.hotel.charAt(0).toUpperCase() + userData.hotel.slice(1) : 'Standard'}</div>
        </div>
        <div style="margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            <div><strong>🌡️ Climate:</strong> ${planData.destination.climate}</div>
            <div><strong>💰 Currency:</strong> ${planData.destination.currency}</div>
            <div><strong>🗣️ Languages:</strong> ${planData.destination.language}</div>
            <div><strong>⏰ Best Time:</strong> ${planData.destination.bestTime}</div>
          </div>
        </div>
      </div>

      <!-- Budget Breakdown -->
      <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="color: #d63384; margin-top: 0;">💰 Budget Analysis ${hasAIContent ? '(AI Optimized)' : ''}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
            <div style="font-size: 24px;">🚗</div>
            <div><strong>Transportation</strong></div>
            <div style="font-size: 18px; color: #d63384;">₹${planData.budget.transport.toLocaleString()}</div>
          </div>
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
            <div style="font-size: 24px;">🏨</div>
            <div><strong>Accommodation</strong></div>
            <div style="font-size: 18px; color: #d63384;">₹${planData.budget.accommodation.toLocaleString()}</div>
          </div>
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
            <div style="font-size: 24px;">🍽️</div>
            <div><strong>Food & Dining</strong></div>
            <div style="font-size: 18px; color: #d63384;">₹${planData.budget.food.toLocaleString()}</div>
          </div>
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
            <div style="font-size: 24px;">🎯</div>
            <div><strong>Activities</strong></div>
            <div style="font-size: 18px; color: #d63384;">₹${planData.budget.activities.toLocaleString()}</div>
          </div>
          <div style="text-align: center; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
            <div style="font-size: 24px;">🛍️</div>
            <div><strong>Shopping</strong></div>
            <div style="font-size: 18px; color: #d63384;">₹${planData.budget.shopping.toLocaleString()}</div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.9); border-radius: 10px;">
          <div style="font-size: 24px; font-weight: bold; color: #d63384; margin-bottom: 10px;">
            Total Estimated Cost: ₹${planData.budget.total.toLocaleString()}
          </div>
          <div style="font-size: 16px; color: #666;">
            Your budget: ₹${parseInt(userData.budget).toLocaleString()} 
            ${planData.budget.total <= parseInt(userData.budget) ? 
              '<span style="color: #28a745; font-weight: bold;">✅ Perfect! Within budget</span>' : 
              '<span style="color: #dc3545; font-weight: bold;">⚠️ Over budget by ₹' + (planData.budget.total - parseInt(userData.budget)).toLocaleString() + '</span>'
            }
          </div>
        </div>
      </div>

      <!-- Daily Itinerary -->
      <div style="background: linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%); padding: 25px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="color: #0066cc; margin-top: 0;">📅 Detailed Daily Itinerary ${hasAIContent ? '(AI Curated)' : ''}</h3>
        ${planData.dailyItinerary.map(day => `
          <div style="margin-bottom: 20px; background: rgba(255,255,255,0.9); border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #3399ff, #0066cc); color: white; padding: 15px; font-weight: bold;">
              📅 Day ${day.day}: ${day.theme}
            </div>
            <div style="padding: 20px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <div style="padding: 12px; background: #fff3cd; border-radius: 8px;">
                  <strong>🌅 Morning:</strong><br>${day.morning}
                </div>
                <div style="padding: 12px; background: #d4edda; border-radius: 8px;">
                  <strong>☀️ Afternoon:</strong><br>${day.afternoon}
                </div>
                <div style="padding: 12px; background: #d1ecf1; border-radius: 8px;">
                  <strong>🌙 Evening:</strong><br>${day.evening}
                </div>
              </div>
              ${day.meals && typeof day.meals === 'object' ? `
                <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                  <strong>🍽️ Meals:</strong>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px;">
                    <div><strong>Breakfast:</strong> ${day.meals.breakfast}</div>
                    <div><strong>Lunch:</strong> ${day.meals.lunch}</div>
                    <div><strong>Dinner:</strong> ${day.meals.dinner}</div>
                  </div>
                </div>
              ` : `
                <div style="padding: 12px; background: #f8d7da; border-radius: 8px; margin-bottom: 10px;">
                  <strong>🍽️ Meals:</strong> ${day.meals || 'Local cuisine recommendations'}
                </div>
              `}
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="padding: 12px; background: #e2e3e5; border-radius: 8px;">
                  <strong>💡 Tips:</strong> ${day.tips}
                </div>
                <div style="padding: 12px; background: #d4edda; border-radius: 8px;">
                  <strong>💰 Est. Cost:</strong> ${day.estimatedCost}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Attractions & Activities -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-bottom: 25px;">
        <div style="background: linear-gradient(135deg, #fff8f0 0%, #fef3e2 100%); padding: 20px; border-radius: 12px;">
          <h3 style="color: #fd7e14; margin-top: 0;">📍 ${hasAIContent ? 'AI-Recommended' : 'Top'} Attractions</h3>
          <div style="max-height: 400px; overflow-y: auto;">
            ${planData.attractions.map(attraction => `
              <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
                <div style="font-weight: bold; color: #fd7e14; margin-bottom: 5px;">${attraction.name}</div>
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${attraction.description}</div>
                <div style="font-size: 12px; color: #888; margin-bottom: 5px;">
                  ⏱️ ${attraction.visitDuration} | 💰 ${attraction.entryFee} | 🌟 ${attraction.category}
                </div>
                ${attraction.location ? `<div style="font-size: 12px; color: #28a745;"><strong>📍 Location:</strong> ${attraction.location}</div>` : ''}
                <div style="font-size: 12px; color: #007bff; margin-top: 5px;">
                  <strong>Best time:</strong> ${attraction.bestTimeToVisit}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%); padding: 20px; border-radius: 12px;">
          <h3 style="color: #198754; margin-top: 0;">🎯 Personalized Activities</h3>
          <div style="max-height: 400px; overflow-y: auto;">
            ${planData.activities.map(activity => `
              <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
                <div style="font-weight: bold; color: #198754; margin-bottom: 5px;">${activity.name}</div>
                <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${activity.description}</div>
                <div style="font-size: 12px; color: #888; margin-bottom: 5px;">
                  ⏱️ ${activity.duration} | 💰 ${activity.cost} | 📊 ${activity.difficulty}
                </div>
                ${activity.location ? `<div style="font-size: 12px; color: #28a745;"><strong>📍 Where:</strong> ${activity.location}</div>` : ''}
                <div style="font-size: 12px; color: ${activity.ageAppropriate ? '#28a745' : '#dc3545'}; margin-top: 5px;">
                  ${activity.ageAppropriate ? '✅ Age appropriate' : '⚠️ Consider age suitability'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Cuisine & Shopping -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-bottom: 25px;">
        <div style="background: linear-gradient(135deg, #fef7ff 0%, #f3e5f5 100%); padding: 20px; border-radius: 12px;">
          <h3 style="color: #9c27b0; margin-top: 0;">🍽️ Must-Try Local Cuisine</h3>
          ${planData.cuisine.map(dish => `
            <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
              <div style="font-weight: bold; color: #9c27b0; margin-bottom: 5px;">
                ${dish.dish} ${dish.mustTry ? '⭐' : ''}
              </div>
              <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${dish.description}</div>
              <div style="font-size: 12px; color: #888; margin-bottom: 5px;">
                💰 ${dish.price} | ${dish.dietaryInfo || 'Mixed options'}
              </div>
              ${dish.restaurants ? `<div style="font-size: 12px; color: #28a745;"><strong>🏪 Where:</strong> ${dish.restaurants}</div>` : ''}
            </div>
          `).join('')}
        </div>

        <div style="background: linear-gradient(135deg, #fff5f0 0%, #ffe5d6 100%); padding: 20px; border-radius: 12px;">
          <h3 style="color: #d2691e; margin-top: 0;">🛍️ Shopping Guide</h3>
          ${planData.shopping.map(item => `
            <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.8); border-radius: 8px;">
              <div style="font-weight: bold; color: #d2691e; margin-bottom: 5px;">${item.item}</div>
              <div style="font-size: 14px; color: #666; margin-bottom: 8px;">${item.description}</div>
              <div style="font-size: 12px; color: #888; margin-bottom: 5px;">
                💰 ${item.priceRange}
              </div>
              ${item.markets ? `<div style="font-size: 12px; color: #28a745; margin-bottom: 5px;"><strong>🏪 Markets:</strong> ${item.markets}</div>` : ''}
              ${item.bargaining ? `<div style="font-size: 12px; color: #007bff;"><strong>💡 Bargaining:</strong> ${item.bargaining}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Travel Tips -->
      <div style="background: linear-gradient(135deg, #f5f0ff 0%, #ede7f6 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
        <h3 style="color: #6f42c1; margin-top: 0;">💡 ${hasAIContent ? 'AI-Generated' : 'Smart'} Travel Tips</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 15px;">
          ${planData.tips.map(tip => `
            <div style="padding: 12px; background: rgba(255,255,255,0.8); border-radius: 8px; border-left: 4px solid #6f42c1;">
              ${tip}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin-top: 30px; padding: 30px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px;">
        <h3 style="color: #495057; margin-bottom: 20px;">
          🎉 Your ${hasAIContent ? 'AI-Powered' : 'Smart'} Trip Plan is Ready!
        </h3>
        <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
          <button onclick="window.print()" style="background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
            🖨️ Print Plan
          </button>
          <button onclick="location.reload()" style="background: #6c757d; color: white; border: none; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">
            🔄 Plan Another Trip
          </button>
          <button onclick="generateNewVariation()" style="background: #007bff; color: white; border: none; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);">
            ${hasAIContent ? '🤖 Generate New AI Variation' : '🔄 Try AI Mode'}
          </button>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: rgba(255, 255, 255, 0.8); border-radius: 10px;">
          <p style="margin: 0; color: #6c757d; font-style: italic;">
            ${hasAIContent ? 
              `"This comprehensive trip plan was generated using advanced AI. Processing time: ${planData.metadata?.processingTime || 0}ms"` : 
              `"Upgrade to AI mode for specific restaurant names and detailed local insights!"`
            }
          </p>
        </div>
      </div>
    </div>
  `;
  
  document.querySelector('.container').innerHTML = tripPlanHTML;
}

// Global variables
let currentUserData = null;
let aiPlanner = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  aiPlanner = new AITripPlanner();
  console.log('🚀 AI Trip Planner initialized');
  console.log('🔧 Backend URL:', aiPlanner.backendUrl);
  console.log('🔧 Fallback mode:', aiPlanner.fallbackMode);
});

// Generate new variation
async function generateNewVariation() {
  if (currentUserData) {
    const submitBtn = document.querySelector('button[onclick="generateNewVariation()"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '🤖 Generating new variation...';
    submitBtn.disabled = true;
    
    try {
      const newPlan = await aiPlanner.generateTripPlan(currentUserData);
      displayAITripPlan(newPlan, currentUserData);
    } catch (error) {
      console.error('Error:', error);
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }
}

// Main form handler
document.getElementById("tripForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());
  currentUserData = data;

  console.log('📝 User Input:', data);

  // Enhanced validation
  const requiredFields = ['name', 'age', 'people', 'destination', 'days', 'budget', 'transport'];
  const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
  
  if (missingFields.length > 0) {
    alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
    return;
  }

  if (isNaN(data.age) || parseInt(data.age) < 1 || parseInt(data.age) > 120) {
    alert('Please enter a valid age between 1 and 120');
    return;
  }

  if (isNaN(data.people) || parseInt(data.people) < 1 || parseInt(data.people) > 50) {
    alert('Please enter a valid number of travelers between 1 and 50');
    return;
  }

  if (isNaN(data.budget) || parseInt(data.budget) < 100) {
    alert('Please enter a valid budget amount (minimum ₹100)');
    return;
  }

  // Show processing message
  const submitBtn = event.target.querySelector('.btn');
  const originalText = submitBtn.textContent;
  submitBtn.innerHTML = `🤖 AI is creating your ${data.destination} adventure...`;
  submitBtn.disabled = true;
  submitBtn.style.background = '#6c757d';

  try {
    // Generate trip plan
    console.log('🚀 Starting trip plan generation...');
    const tripPlan = await aiPlanner.generateTripPlan(data);
    
    // Add realistic processing delay
    setTimeout(() => {
      displayAITripPlan(tripPlan, data);
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error generating trip plan:', error);
    alert('Sorry, there was an error generating your trip plan. Please try again or check if the backend server is running.');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    submitBtn.style.background = '#3399ff';
  }
});

// Add responsive styling
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 768px) {
    div[style*="display: grid"] {
      grid-template-columns: 1fr !important;
    }
    div[style*="display: flex"] {
      flex-direction: column !important;
    }
    button {
      width: 100% !important;
      margin: 5px 0 !important;
    }
  }
  
  @media print {
    button { display: none !important; }
    div[style*="max-height"] {
      max-height: none !important;
      overflow: visible !important;
    }
  }
`;
document.head.appendChild(style);

// Backend health check on page load
async function checkBackendHealth() {
  try {
    const response = await fetch(`${aiPlanner.backendUrl}/health`);
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Backend server is healthy:', health);
      if (!health.openai_configured) {
        console.warn('⚠️ OpenAI API key not configured on backend');
      }
    }
  } catch (error) {
    console.warn('⚠️ Backend server not reachable. Using offline mode.');
      aiPlanner.fallbackMode = true;
    }
  }