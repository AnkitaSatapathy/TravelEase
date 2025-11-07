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

// Helper function to fetch real news from News API
async function fetchRealNews(destination) {
  try {
    // Using NewsAPI.org - you'll need to get a free API key from https://newsapi.org/
    const newsApiKey = process.env.NEWS_API_KEY;
    
    if (!newsApiKey) {
      console.warn('⚠️ NEWS_API_KEY not configured, skipping real news fetch');
      return null;
    }

    const searchQuery = `${destination} safety OR ${destination} travel OR ${destination} attack OR ${destination} disaster OR ${destination} conflict OR ${destination} unrest`;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30); // Last 30 days
    
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&from=${fromDate.toISOString().split('T')[0]}&sortBy=publishedAt&language=en&apiKey=${newsApiKey}`;
    
    console.log('📰 Fetching real news from NewsAPI...');
    const response = await fetch(newsUrl);
    
    if (!response.ok) {
      console.warn('⚠️ NewsAPI request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.articles && data.articles.length > 0) {
      console.log(`✅ Found ${data.articles.length} news articles`);
      return data.articles.slice(0, 10); // Return top 10 articles
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    return null;
  }
}

// NEW: Deterministic analyzer for news articles to reliably detect clear, recent dangers
function analyzeNewsForSafety(articles) {
  if (!articles || articles.length === 0) return null;

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const HIGH_IMPACT_KEYWORDS = ['invasion','airstrike','shelling','bomb','killed','massacre','siege','evacuat','curfew','state of emergency','attack','occupied','missile','rocket','heavy fighting','battle','casualties'];
  const MEDIUM_IMPACT_KEYWORDS = ['riot','protest','unrest','clashes','looting','arson','explosion','terrorist','suspected attack'];
  const NATURAL_DISASTER_KEYWORDS = ['earthquake','flood','cyclone','hurricane','tsunami','landslide','wildfire','storm','monsoon','mudslide','avalanche'];

  const hits = [];

  for (const art of articles) {
    const title = (art.title || '').toLowerCase();
    const desc = (art.description || '').toLowerCase();
    const combined = `${title} ${desc}`;
    const published = art.publishedAt ? new Date(art.publishedAt).getTime() : null;
    const daysAgo = published ? Math.round((now - published) / DAY_MS) : 3650;

    const matched = [];
    for (const kw of HIGH_IMPACT_KEYWORDS) {
      if (combined.includes(kw)) matched.push({ kw, severity: 'high' });
    }
    for (const kw of MEDIUM_IMPACT_KEYWORDS) {
      if (combined.includes(kw)) matched.push({ kw, severity: 'medium' });
    }
    for (const kw of NATURAL_DISASTER_KEYWORDS) {
      if (combined.includes(kw)) matched.push({ kw, severity: 'high', type: 'natural' });
    }

    if (matched.length > 0) {
      hits.push({
        article: art,
        matched,
        daysAgo
      });
    }
  }

  if (hits.length === 0) return null;

  // Determine severity heuristically
  const recentHits = hits.filter(h => h.daysAgo <= 14);
  const recentHighHits = recentHits.filter(h => h.matched.some(m => m.severity === 'high')).length;
  const recentMediumHits = recentHits.filter(h => h.matched.some(m => m.severity === 'medium')).length;

  let severity = 'low';
  if (recentHighHits >= 1 && recentHits.length >= 1) severity = 'high';
  else if (recentMediumHits >= 1 || (recentHits.length >= 2 && recentHighHits === 0)) severity = 'medium';
  else if (hits.length > 0) severity = 'low';

  // Build concise mainConcern and newsHeadlines
  const sorted = hits.sort((a, b) => a.daysAgo - b.daysAgo);
  const newsHeadlines = sorted.slice(0, 6).map(h => ({
    title: h.article.title || '',
    summary: h.article.description || '',
    date: h.article.publishedAt ? new Date(h.article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''
  }));

  // Compose a short main concern using matched keywords (conservative, factual)
  const concernTypes = new Set();
  for (const h of hits) {
    for (const m of h.matched) {
      if (NATURAL_DISASTER_KEYWORDS.includes(m.kw)) concernTypes.add('natural disaster');
      else if (HIGH_IMPACT_KEYWORDS.includes(m.kw)) concernTypes.add('armed conflict/attack');
      else if (MEDIUM_IMPACT_KEYWORDS.includes(m.kw)) concernTypes.add('civil unrest/riot');
    }
  }
  const mainConcern = `Recent news indicates ${Array.from(concernTypes).join(' and ')} activity. See headlines for details.`;

  // Recommendations based on severity
  const recommendations = [];
  if (severity === 'high') {
    recommendations.push('🔴 High risk detected — travel NOT recommended. Postpone non-essential travel.');
    recommendations.push('Check official government travel advisories and contact your embassy/consulate.');
    recommendations.push('If you must travel, register with your embassy and have evacuation plans.');
  } else if (severity === 'medium') {
    recommendations.push('🟡 Exercise caution — monitor local news and avoid known hotspots.');
    recommendations.push('Follow local authority guidance and consider travel insurance with evacuation coverage.');
  } else {
    recommendations.push('🟢 Low-level concerns found — stay informed and avoid large gatherings.');
  }

  return {
    destination: articles[0]?.source?.name || null, // will be replaced by caller if needed
    hasConcerns: severity !== 'low' ? true : true, // keep true if any hits exist; caller can interpret low as advisory
    severityLevel: severity === 'high' ? 'high' : (severity === 'medium' ? 'medium' : 'low'),
    mainConcern,
    newsHeadlines,
    recommendations,
    lastUpdated: new Date().toISOString()
  };
}

// NEW: Destination Safety Check Endpoint with Real News
app.post('/api/check-destination-safety', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { destination } = req.body;
    if (!destination) return res.status(400).json({ error: 'Destination is required' });

    console.log('🔍 Checking safety for:', destination);

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }

    const realNews = await fetchRealNews(destination);
    
    // Run deterministic analyzer first
    const deterministic = analyzeNewsForSafety(realNews);
    if (deterministic && deterministic.newsHeadlines && deterministic.newsHeadlines.length > 0) {
      // Fill destination field properly and add metadata
      deterministic.destination = destination;
      deterministic.processingTime = Date.now() - startTime;
      deterministic.newsSourcesChecked = realNews ? realNews.length : 0;

      console.log('⚠️ Deterministic analyzer flagged concerns:', deterministic.severityLevel);
      // Return early to ensure clear, recent issues are surfaced as a warning immediately
      return res.json({ success: true, data: deterministic });
    }

    // If deterministic analyzer found nothing concerning or no articles, proceed to OpenAI as before
    let newsContext = '';
    if (realNews && realNews.length > 0) {
      newsContext = '\n\nRECENT NEWS ARTICLES (Last 30 days):\n';
      realNews.forEach((article, idx) => {
        const publishDate = new Date(article.publishedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        newsContext += `${idx + 1}. [${publishDate}] ${article.title}\n   ${article.description || ''}\n`;
      });
      newsContext += '\n\nUse ONLY these real news articles to assess safety. Do not use outdated information.';
    } else {
      newsContext = '\n\nNo recent news articles found. Based on general knowledge, assess if this destination has any known ongoing safety concerns. If you are not aware of any current issues, set hasConcerns to false.';
    }

    const safetyPrompt = `You are a travel safety expert analyzing REAL CURRENT NEWS for travel destinations.

Destination: ${destination}
Current Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
${newsContext}

CRITICAL INSTRUCTIONS:
1. ONLY use the news articles provided above (if any)
2. DO NOT make up news or use outdated information from 2023 or earlier
3. If no recent news articles are found, assume the destination is currently safe
4. Only flag concerns if there are ACTUAL recent news articles showing:
   - Active conflicts, wars, or military operations
   - Terrorist attacks (within last 30 days)
   - Natural disasters (currently ongoing)
   - Major civil unrest or riots (currently happening)
   - Disease outbreaks
   - Official travel bans

Respond with this EXACT JSON structure (no markdown formatting):

{
  "destination": "${destination}",
  "hasConcerns": true/false,
  "severityLevel": "low/medium/high/none",
  "mainConcern": "Brief description based ONLY on the real news provided above (null if no concerns)",
  "newsHeadlines": [
    {
      "title": "Exact headline from the news articles above",
      "summary": "Brief summary from the article",
      "date": "Actual date from the article (e.g., 'Nov 7, 2024')"
    }
  ],
  "recommendations": [
    "Specific safety recommendation based on real news (empty array if no concerns)"
  ],
  "lastUpdated": "${new Date().toISOString()}"
}

IMPORTANT: 
- If no recent concerning news exists, set: hasConcerns: false, severityLevel: "none", mainConcern: null, newsHeadlines: [], recommendations: []
- DO NOT mention "civil unrest" unless there are specific recent articles about it
- BE VERY CONSERVATIVE - only flag real, recent, verified concerns
- Use actual dates from the news articles provided`;

    // Call OpenAI API
    console.log('🌐 Calling OpenAI for safety analysis...');
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
            content: 'You are a travel safety analyst. You ONLY report on safety concerns when there is REAL, RECENT news evidence. You do not speculate or use outdated information. If no recent concerning news exists, you report the destination as safe.'
          },
          {
            role: 'user',
            content: safetyPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.1 // Very low temperature for factual accuracy
      })
    });

    console.log('📡 OpenAI Safety Check Response Status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API Error:', errorText);
      return res.status(openaiResponse.status).json({ 
        error: 'OpenAI API error', 
        details: errorText 
      });
    }

    const openaiData = await openaiResponse.json();
    console.log('✅ Safety analysis completed');

    // Parse the response
    let safetyData;
    const rawContent = openaiData.choices[0].message.content;
    
    try {
      // Clean up the response
      let cleanContent = rawContent.trim();
      if (cleanContent.includes('```json')) {
        const match = cleanContent.match(/```json\n([\s\S]*?)\n```/);
        if (match) cleanContent = match[1];
      } else if (cleanContent.includes('```')) {
        const match = cleanContent.match(/```\n([\s\S]*?)\n```/);
        if (match) cleanContent = match[1];
      }
      
      cleanContent = cleanContent.trim();
      safetyData = JSON.parse(cleanContent);
      console.log('✅ Successfully parsed safety data');
      
    } catch (parseError) {
      console.error('❌ Failed to parse safety response:', parseError.message);
      return res.status(500).json({ 
        error: 'Failed to parse AI response', 
        details: parseError.message 
      });
    }

    // Add processing metadata
    safetyData.processingTime = Date.now() - startTime;
    safetyData.newsSourcesChecked = realNews ? realNews.length : 0;

    console.log(`🎉 Safety check completed in ${Date.now() - startTime}ms`);
    console.log(`⚠️ Has concerns: ${safetyData.hasConcerns}, Severity: ${safetyData.severityLevel}`);
    
    res.json({ success: true, data: safetyData });

  } catch (error) {
    console.error('❌ Server error in safety check:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

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
  console.log(`🔍 Safety check endpoint: http://localhost:${PORT}/api/check-destination-safety`);
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