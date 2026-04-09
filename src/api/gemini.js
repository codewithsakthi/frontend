import api from './client';

/**
 * Send a prompt to Gemini LLM backend endpoint and get a response.
 * @param {string} prompt - The prompt/question to send to Gemini.
 * @returns {Promise<string>} - The Gemini response text.
 */
export async function askGemini(prompt) {
  const res = await api.post('/ai/gemini/ask', { prompt });
  return res.response;
}
