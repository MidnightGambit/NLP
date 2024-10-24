// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const { NlpManager } = require('node-nlp');
const nlp = require('compromise');
const Sentiment = require('sentiment');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize NLP manager
const manager = new NlpManager({ languages: ['en'] });
const sentimentAnalyzer = new Sentiment();

// Adding intents
manager.addDocument('en', 'Translate %text% to Hindi', 'translation.hindi');
manager.addDocument('en', 'What is the weather like?', 'weather');

// Sample Google API function (Replace with actual API call)
async function translateText(text, targetLang) {
    const response = await axios.post(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_API_KEY}`, {
        q: text,
        target: targetLang,
    });
    return response.data.data.translations[0].translatedText;
}

// New NLP Feature: Named Entity Recognition (NER) with Compromise
function extractEntities(text) {
    let doc = nlp(text);
    let people = doc.people().out('array');
    let places = doc.places().out('array');
    let dates = doc.dates().out('array');
    return { people, places, dates };
}

// New NLP Feature: Sentiment Analysis
function analyzeSentiment(text) {
    const result = sentimentAnalyzer.analyze(text);
    return result.score;  // Returns positive/negative sentiment score
}

// Conversation history
let conversationHistory = [];

// Chat endpoint
app.post('/chat', async (req, res) => {
    const { userMessage } = req.body;
    conversationHistory.push(userMessage);

    const intent = await manager.process('en', userMessage);
    let response;

    // Check sentiment of user message
    const sentimentScore = analyzeSentiment(userMessage);
    if (sentimentScore < 0) {
        response = "I sense you're upset. Is there anything I can help with?";
    } else if (intent.intent === 'translation.hindi') {
        const textToTranslate = intent.entities[0].option; // Adjust based on your NLU setup
        response = await translateText(textToTranslate, 'hi'); // Hindi code
    } else {
        const entities = extractEntities(userMessage);
        if (entities.people.length > 0) {
            response = `It looks like you're talking about someone: ${entities.people.join(', ')}`;
        } else if (entities.places.length > 0) {
            response = `You're mentioning a place: ${entities.places.join(', ')}`;
        } else if (entities.dates.length > 0) {
            response = `You referred to a date: ${entities.dates.join(', ')}`;
        } else {
            response = "I'm sorry, I don't understand.";
        }
    }

    conversationHistory.push(response);
    res.json({ response });
});

// Feedback endpoint
app.post('/feedback', (req, res) => {
    const { translationId, rating } = req.body;
    // Save feedback logic
    res.json({ message: 'Feedback received.' });
});

// Reset conversation
app.post('/reset', (req, res) => {
    conversationHistory = [];
    res.json({ message: 'Conversation reset.' });
});
app.post('/translate', async (req, res) => {
    try {
        const textToTranslate = req.body.text;
        console.log("Text to translate:", textToTranslate);

        const translation = await translateText(textToTranslate);
        console.log("Translated text:", translation);

        res.json({ translatedText: translation });
    } catch (error) {
        console.error("Error in translation:", error);
        res.status(500).send("Error in translation");
    }
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
