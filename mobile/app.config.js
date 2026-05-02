import 'dotenv/config';

export default {
  expo: {
    name: "DementIQ",
    slug: "dementiq",
    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
      groqApiKey: process.env.GROQ_API_KEY,
    }
  }
};