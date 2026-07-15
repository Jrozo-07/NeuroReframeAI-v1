const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY is not defined in the environment variables. The API calls will fail.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');

module.exports = genAI;
