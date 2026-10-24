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

// ---------------------------------------------------------------------------------------------------------------
// Provider-switchable chat call, used by the assistant. The existing features keep using the OpenRouter-backed class
// above; a feature moves to another provider only by setting its own env variables, with no code change:
//   AI_PROVIDER_ASSISTANT = openai (default) | openrouter
//   OPENAI_API_KEY, OPENAI_ASSISTANT_MODEL        (no model name is built in, so the model is a deployment choice)
//   OPENROUTER_API_KEY, OPENROUTER_ASSISTANT_MODEL (used when the provider is openrouter)
const PROVIDERS = {
  openai: { url: 'https://api.openai.com/v1/chat/completions', keyEnv: 'OPENAI_API_KEY', modelEnv: 'OPENAI_ASSISTANT_MODEL' },
  openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', keyEnv: 'OPENROUTER_API_KEY', modelEnv: 'OPENROUTER_ASSISTANT_MODEL' },
};

// Which provider, key and model a feature uses, or { error } when it is not configured.
const resolveProvider = (feature = 'ASSISTANT', env = process.env) => {
  const name = String(env[`AI_PROVIDER_${feature}`] || 'openai').toLowerCase();
  const p = PROVIDERS[name];
  if (!p) return { error: `Unknown AI provider "${name}"` };
  const apiKey = env[p.keyEnv];
  const model = env[p.modelEnv];
  if (!apiKey) return { error: `${p.keyEnv} is not set` };
  if (!model) return { error: `${p.modelEnv} is not set` };
  return { provider: name, url: p.url, apiKey, model };
};

/**
 * @param {{provider:object, messages:{role:string,content:string}[], maxTokens?:number, timeoutMs?:number, fetchImpl?:Function}} opts
 * @returns {Promise<{text:string, tokens:number}>}
 */
const chatCompletion = async ({ provider, messages, maxTokens = 400, timeoutMs = 20000, fetchImpl }) => {
  const doFetch = fetchImpl || fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' };
    if (provider.provider === 'openrouter') { headers['HTTP-Referer'] = process.env.FRONTEND_URL || 'https://velaivaaipu.in'; headers['X-Title'] = 'Velaivaaipu'; }
    const res = await doFetch(provider.url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      // No temperature is sent: some current models accept only their default. max_completion_tokens is the current name.
      body: JSON.stringify({ model: provider.model, messages, max_completion_tokens: maxTokens }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`${provider.provider} API error ${res.status}: ${errText.slice(0, 300)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error(`Unexpected ${provider.provider} response`);
    return { text: text.trim(), tokens: Number(data?.usage?.total_tokens) || Math.ceil((JSON.stringify(messages).length + text.length) / 4) };
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { GoogleGenerativeAI, resolveProvider, chatCompletion };
