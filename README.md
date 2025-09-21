# TravelEase

🤖 AI-Powered Trip Planner

A comprehensive trip planning application that uses OpenAI's GPT to generate detailed, location-specific travel itineraries with real restaurant names, specific attractions, and detailed daily plans.

## 🌟 Features

- **Real OpenAI Integration** - Gets specific place names, restaurants, and local insights
- **Dynamic Destination Support** - Works for ANY destination worldwide
- **Detailed Itineraries** - Day-wise plans with specific restaurant recommendations
- **Smart Budget Analysis** - Realistic cost breakdowns
- **Local Cuisine Guide** - Authentic food recommendations with restaurant names
- **Cultural Information** - Language, currency, customs, and local tips
- **Responsive Design** - Works on desktop and mobile
- **Print-Ready Format** - Generate PDF-ready trip plans

## 📁 Project Structure

```
trip-planner/
├── frontend/
|   ├── index.html     # Main webpage
│   ├── styles.css     # Styling 
│   |── main.js 
│   ├── trip.html      
│   ├── trip.css       
│   └── trip.js        # Frontend JavaScript with AI integration
├── backend/
│   ├── server.js      # Express server with OpenAI integration
│   ├── package.json   # Node.js dependencies
│   └── .env           # Environment variables (API keys)
└── README.md          # This setup guide
```

## 💡 Features Explanation

### What Makes This Special:

1. **Real AI Integration** - Not just templates, actual OpenAI API calls
2. **Specific Results** - Real restaurant names, exact locations, authentic recommendations
3. **Dynamic Content** - Different results for each generation
4. **Comprehensive Planning** - Budget, itinerary, tips, emergency info
5. **Local Expertise** - Cultural insights, language info, local customs

### AI Prompt Engineering:

The system uses advanced prompts that request:
- SPECIFIC place names and restaurant names
- Exact addresses or areas where possible
- Real hotels, restaurants, and attractions by name
- Realistic costs in local currency
- Cultural etiquette and local customs

**Need Help?** Check the console logs and error messages - they provide detailed debugging information!
