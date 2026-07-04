require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  try {
    const prompt = "Test prompt";
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const resultObj = await model.generateContent(prompt);
    const responseText = resultObj.response.text();
    const result = JSON.parse(responseText);
    console.log(result);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
