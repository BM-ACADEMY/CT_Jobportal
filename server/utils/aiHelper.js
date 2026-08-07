class GoogleGenerativeAI {
  constructor(apiKey) {
    // Prefer OPENROUTER_API_KEY, fallback to provided key for compatibility
    this.apiKey = process.env.OPENROUTER_API_KEY || apiKey;
  }
  
  getGenerativeModel({ model, generationConfig }) {
    // OpenRouter models require the provider prefix (e.g. google/gemini-2.5-flash)
    const orModel = model.startsWith("google/") ? model : `google/${model}`;
    const temperature = generationConfig?.temperature || 0.7;
    
    return {
      generateContent: async (prompt) => {
        if (!this.apiKey) {
          throw new Error("OPENROUTER_API_KEY is not set in environment");
        }

        const payload = {
          model: orModel,
          messages: [{ role: "user", content: prompt }],
          temperature: temperature,
        };
        
        // OpenRouter / OpenAI json mode
        if (generationConfig?.responseMimeType === "application/json") {
            payload.response_format = { type: "json_object" };
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Velaivaaipu"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API Error: ${response.status} ${errText}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.choices || !data.choices[0]) {
          throw new Error(`Unexpected OpenRouter response: ${JSON.stringify(data)}`);
        }

        const textContent = data.choices[0].message.content;
        
        return {
          response: {
            text: () => textContent
          }
        };
      }
    };
  }
}

module.exports = { GoogleGenerativeAI };
