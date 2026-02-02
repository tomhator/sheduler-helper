const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' }); // Load from .env.local

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Just to access the client, but listModels is on the client? 
        // Actually listModels is usually on the GoogleGenerativeAI instance or not directly exposed in simple way in some versions?
        // Let's check documentation memory if I had it... 
        // In strict SDK, it might be tricky. But let's look at the error message again: "Call ListModels to see..."
        // Wait, the SDK exposes `getGenerativeModel`. 
        // There isn't always a direct `listModels` in the high level `GoogleGenerativeAI` class in Node SDK?
        // Let's try to use the raw fetch if needed, but let's try to use the SDK first if possible.
        // Actually, I'll just use curl to list models to be dependency-free and simpler.
    } catch (e) {
        console.error(e);
    }
}

// Switching to curl approach is better.
