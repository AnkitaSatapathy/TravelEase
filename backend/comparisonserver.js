import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5001;

// Middleware
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Comparison server is running' });
});

// Main comparison endpoint
app.post('/api/compare-destinations', async (req, res) => {
  try {
    const { destinations, priorities, budget, duration, month } = req.body;

    // Validate input
    if (!destinations || destinations.length < 2) {
      return res.status(400).json({ error: 'At least 2 destinations required' });
    }

    if (!Array.isArray(priorities) || priorities.length === 0) {
      return res.status(400).json({ error: 'At least one priority required' });
    }

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }

    const prompt = buildComparisonPrompt(
      destinations,
      priorities,
      budget,
      duration,
      month
    );

    console.log('🌐 Calling OpenAI API for comparison...');
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert travel advisor. Provide structured JSON responses with detailed destination comparisons.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${apiResponse.status}`);
    }

    const apiData = await apiResponse.json();
    const responseText = apiData.choices[0].message.content;

    // Parse the response
    const comparisons = parseComparisons(responseText, destinations);

    res.json({
      success: true,
      comparisons,
      metadata: {
        timestamp: new Date().toISOString(),
        destinationCount: destinations.length,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
      }
    });
  } catch (error) {
    console.error('Error in compare-destinations:', error);
    res.status(500).json({
      error: 'Failed to compare destinations',
      details: error.message
    });
  }
});

function buildComparisonPrompt(destinations, priorities, budget, duration, month) {
  const destList = destinations.map(d => `- ${d}`).join('\n');
  const priorityList = priorities.map(p => `- ${p}`).join('\n');

  return `You are an expert travel advisor. Compare the following destinations based on the user's preferences and constraints.

DESTINATIONS TO COMPARE:
${destList}

USER PREFERENCES & CONSTRAINTS:
Budget: ₹${budget}
Trip Duration: ${duration} days
Preferred Month: ${month}
Travel Priorities:
${priorityList}

For EACH destination, provide a detailed comparison in the following JSON format (respond with ONLY valid JSON, no markdown):

[
  {
    "destination": "Destination Name",
    "matchScore": 85,
    "overview": "Brief 2-3 sentence overview of the destination",
    "climate": "Weather and climate information for the specified month",
    "budget": "Detailed budget breakdown for accommodation, food, activities, transport",
    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
    "considerations": ["Consideration 1", "Consideration 2", "Consideration 3"],
    "activities": "1. Activity name and description\n2. Activity name and description\n3. Activity name and description\n4. Activity name and description"
  }
]

IMPORTANT: 
- matchScore should be 0-100 based on how well the destination matches user priorities
- Be specific about costs in INR (Indian Rupees)
- Consider seasonal factors for the ${month}
- Keep all responses practical and helpful
- For activities, provide as numbered list format (1. Activity, 2. Activity, etc.)
- Respond ONLY with valid JSON array, no additional text`;
}

function parseComparisons(responseText, destinations) {
  try {
    // Extract JSON from the response
    let jsonStr = responseText.trim();

    // If the response contains markdown code blocks, extract the JSON
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    // Fix incomplete JSON - find the last closing bracket
    jsonStr = jsonStr.trim();
    if (!jsonStr.endsWith(']')) {
      const lastBracketIndex = jsonStr.lastIndexOf(']');
      if (lastBracketIndex !== -1) {
        jsonStr = jsonStr.substring(0, lastBracketIndex + 1);
      }
    }

    const comparisons = JSON.parse(jsonStr);

    // Validate and ensure all destinations are represented
    if (!Array.isArray(comparisons)) {
      throw new Error('Response is not an array');
    }

    // Fill in any missing destinations with default data
    const returnedDests = new Set(comparisons.map(c => c.destination.toLowerCase()));
    destinations.forEach(dest => {
      if (!returnedDests.has(dest.toLowerCase())) {
        comparisons.push(createDefaultComparison(dest));
      }
    });

    return comparisons;
  } catch (error) {
    console.error('Error parsing comparisons:', error);

    // Return default comparisons if parsing fails
    return destinations.map(dest => createDefaultComparison(dest));
  }
}

function createDefaultComparison(destination) {
  return {
    destination,
    matchScore: 65,
    overview: `${destination} is a popular travel destination known for its unique blend of culture, attractions, and experiences suitable for various types of travelers.`,
    climate: 'Check local weather forecasts for accurate seasonal information.',
    budget: 'Budget varies based on accommodation choice. Mid-range: $80-150/day. Luxury: $200+/day. Budget: $40-80/day.',
    highlights: [
      'Cultural landmarks and historical sites',
      'Local cuisine and dining experiences',
      'Natural attractions and scenic views',
      'Shopping and local markets'
    ],
    considerations: [
      'Consider visa requirements for entry',
      'Check travel advisories before booking',
      'Book accommodations in advance during peak season'
    ],
    activities: 'Mix of sightseeing, local food tours, museum visits, and outdoor activities based on your interests.'
  };
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🌍 Comparison server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});