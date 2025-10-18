import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY 
  });
});

// Enhanced trip planning prompt generator
function createDetailedTripPrompt(userData) {
  const days = parseInt(userData.days.replace(/\D/g, '')) || parseInt(userData.days) || 3;
  
  return `You are an expert travel planner with extensive knowledge of destinations worldwide. Create a comprehensive, detailed trip plan with SPECIFIC place names, restaurant names, and exact locations.

TRIP REQUEST:
- Destination: ${userData.destination}
- Traveler: ${userData.name}, age ${userData.age}
- Group size: ${userData.people} people  
- Duration: ${days} days
- Budget: ₹${userData.budget}
- Transportation: ${userData.transport}
- Accommodation: ${userData.hotel || 'standard'}
- Interests: ${userData.activities || 'general sightseeing'}

CRITICAL REQUIREMENTS:
1. Provide REAL, SPECIFIC place names and restaurant names
2. Include exact addresses or areas where possible
3. Mention actual hotels, restaurants, and attractions by name
4. Give realistic costs in local currency
5. Create detailed day-by-day itinerary with morning/afternoon/evening activities

Respond with this EXACT JSON structure (no markdown formatting):

{
  "destination": {
    "name": "${userData.destination}",
    "country": "Country name",
    "region": "State/Province/Region", 
    "type": "metropolitan/heritage/beach/mountain/adventure/cultural",
    "description": "Compelling 2-sentence description highlighting unique aspects",
    "bestTime": "Best months to visit with weather details",
    "climate": "Current season weather and what to expect",
    "currency": "Local currency with symbol",
    "language": "Primary languages spoken",
    "timeZone": "Time zone with UTC offset"
  },
  "attractions": [
    {
      "name": "SPECIFIC attraction name",
      "description": "Detailed description of what makes this special",
      "category": "historical/cultural/natural/spiritual/modern",
      "visitDuration": "Realistic time needed",
      "entryFee": "Exact cost or range in local currency", 
      "bestTimeToVisit": "Best time of day with reasoning",
      "location": "Specific area/address/landmark nearby"
    }
  ],
  "activities": [
    {
      "name": "Specific activity name",
      "description": "What exactly this involves and why it's worth doing", 
      "duration": "How long it takes",
      "cost": "Realistic cost estimate",
      "difficulty": "easy/moderate/challenging",
      "ageAppropriate": ${parseInt(userData.age) > 65 ? 'false' : 'true'},
      "location": "Where exactly this happens"
    }
  ],
  "cuisine": [
    {
      "dish": "Exact local dish name",
      "description": "What it is, ingredients, why it's special to this region",
      "restaurants": "2-3 SPECIFIC restaurant names where to find it",
      "price": "Price range in local currency",  
      "mustTry": true,
      "dietaryInfo": "Veg/Non-veg/Vegan options available"
    }
  ],
  "dailyItinerary": [${Array.from({length: days}, (_, i) => `
    {
      "day": ${i + 1},
      "theme": "${i === 0 ? 'Arrival and First Impressions' : i === days - 1 ? 'Final Exploration and Departure' : `Cultural Immersion Day ${i}`}",
      "morning": "SPECIFIC activity with exact location name and timing (e.g., 'Visit Lingaraj Temple at 6 AM, located in Old Town area')",
      "afternoon": "SPECIFIC restaurant name and activity (e.g., 'Lunch at Hare Krishna Restaurant, then explore Khandagiri Caves')", 
      "evening": "SPECIFIC evening activity with location (e.g., 'Sunset at Bindu Sagar Lake, dinner at Dalma Restaurant')",
      "meals": {
        "breakfast": "SPECIFIC restaurant/place name with dish recommendations",
        "lunch": "SPECIFIC restaurant name with signature dishes", 
        "dinner": "SPECIFIC restaurant name with must-try items"
      },
      "accommodation": "SPECIFIC hotel name or area recommendation",
      "transportation": "How to get around (specific transport options)",
      "tips": "Day-specific practical tips and local insights",
      "estimatedCost": "Realistic daily cost breakdown"
    }${i < days - 1 ? ',' : ''}`).join('')}
  ],
  "budget": {
    "accommodation": ${Math.round(parseInt(userData.budget) * 0.35)},
    "food": ${Math.round(parseInt(userData.budget) * 0.25)}, 
    "activities": ${Math.round(parseInt(userData.budget) * 0.25)},
    "transport": ${Math.round(parseInt(userData.budget) * 0.10)},
    "shopping": ${Math.round(parseInt(userData.budget) * 0.05)},
    "total": ${Math.round(parseInt(userData.budget))},
    "breakdown": "Detailed explanation of how budget is allocated"
  },
  "accommodation": {
    "budget": "2-3 SPECIFIC budget hotel names with approximate rates",
    "standard": "2-3 SPECIFIC mid-range hotel names with rates", 
    "luxury": "2-3 SPECIFIC luxury hotel names with rates",
    "areas": "Best specific neighborhoods/areas to stay"
  },
  "transportation": {
    "toDestination": {
      "flight": "Specific airport names and airlines that operate, average cost",
      "train": "Specific railway stations and train names, booking tips",
      "bus": "Specific bus operators and routes"
    },
    "local": {
      "options": "Specific local transport (metro lines, bus routes, taxi services)",
      "costs": "Realistic local transport costs",
      "tips": "Practical local transport advice"
    }
  },
  "shopping": [
    {
      "item": "Specific local product/craft name",
      "markets": "SPECIFIC market names and locations",
      "priceRange": "Realistic price ranges",
      "description": "Why this item is special to the region",
      "bargaining": "Bargaining tips for this item"
    }
  ],
  "tips": [
    "SPECIFIC cultural etiquette for ${userData.destination}",
    "Weather-specific packing advice for current season",
    "Local scams to avoid and safety tips",
    "Best time of day to visit major attractions to avoid crowds", 
    "Language phrases that will be helpful",
    "Currency exchange tips and payment methods accepted",
    "Local customs and traditions to respect"
  ],
  "emergency": {
    "contacts": {
      "police": "Local emergency number",
      "medical": "Medical emergency number", 
      "fire": "Fire emergency number",
      "tourist": "Tourist helpline if available"
    },
    "hospitals": "2-3 SPECIFIC hospital names and locations",
    "embassy": "Embassy/consulate information if international travel",
    "precautions": "Specific safety precautions for ${userData.destination}"
  }
}

Make every detail SPECIFIC to ${userData.destination}. Use real place names, actual restaurant names, genuine hotel suggestions, and authentic local information. Avoid generic terms like "local restaurant" or "nearby attractions".`;
}

// Main trip planning endpoint
app.post('/api/generate-trip', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Received trip planning request for:', req.body.destination);
    
    // Validate request
    if (!req.body || !req.body.destination) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['destination', 'name', 'age', 'people', 'days', 'budget', 'transport'] 
      });
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }

    // Generate enhanced prompt
    const prompt = createDetailedTripPrompt(req.body);
    console.log('📝 Generated prompt length:', prompt.length);

    // Call OpenAI API
    console.log('🌐 Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional travel planner with deep local knowledge of destinations worldwide. Always provide specific, real place names and practical information. Never use generic terms.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
      })
    });

    console.log('📡 OpenAI Response Status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API Error:', errorText);
      return res.status(openaiResponse.status).json({ 
        error: 'OpenAI API error', 
        details: errorText,
        status: openaiResponse.status
      });
    }

    const openaiData = await openaiResponse.json();
    console.log('✅ OpenAI API call successful');

    // Parse the response
    let tripPlan;
    const rawContent = openaiData.choices[0].message.content;
    
    try {
      // Clean up the response - remove markdown formatting if present
      let cleanContent = rawContent.trim();
      if (cleanContent.includes('```json')) {
        const match = cleanContent.match(/```json\n([\s\S]*?)\n```/);
        if (match) cleanContent = match[1];
      } else if (cleanContent.includes('```')) {
        const match = cleanContent.match(/```\n([\s\S]*?)\n```/);  
        if (match) cleanContent = match[1];
      }
      
      // Try to fix common JSON issues
      cleanContent = cleanContent.trim();
      
      // If JSON is incomplete, try to find the last valid closing brace
      if (!cleanContent.endsWith('}')) {
        const lastBraceIndex = cleanContent.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          cleanContent = cleanContent.substring(0, lastBraceIndex + 1);
        }
      }
      
      tripPlan = JSON.parse(cleanContent);
      console.log('✅ Successfully parsed OpenAI response');
      
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError.message);
      console.log('📄 Raw response length:', rawContent.length);
      console.log('📄 Raw response preview:', rawContent.substring(0, 1000));
      
      return res.status(500).json({ 
        error: 'Failed to parse AI response - Response was incomplete or malformed', 
        details: parseError.message,
        suggestion: 'Try increasing max_tokens or using a different OpenAI model'
      });
    }

    // Add metadata
    tripPlan.metadata = {
      generatedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      requestId: Math.random().toString(36).substring(7)
    };

    console.log(`🎉 Trip plan generated successfully in ${Date.now() - startTime}ms`);
    res.json({ success: true, data: tripPlan });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error', details: error.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trip Planner Backend Server running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://127.0.0.1:5500'}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully'); 
  process.exit(0);
});