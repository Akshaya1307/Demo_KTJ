import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

class BDHState {
  constructor() {
    this.beliefs = {};
  }

  update(claim, signal) {
    if (!this.beliefs[claim]) {
      this.beliefs[claim] = { support: 0, conflict: 0 };
    }
    if (signal > 0) this.beliefs[claim].support += signal;
    else this.beliefs[claim].conflict += Math.abs(signal);
  }

  score() {
    return Object.values(this.beliefs)
      .reduce((s, b) => s + (b.support - b.conflict), 0);
  }
}

export const handler = async (event) => {
  const { narrative, backstory } = JSON.parse(event.body);
  const state = new BDHState();

  const chunks = narrative.split("\n\n").slice(0, 6);

  for (const chunk of chunks) {
    const prompt = `
Backstory:
${backstory}

Narrative evidence:
${chunk}

Return:
score: +1, +0.5, -0.5, or -1
claim: short causal claim
`;
    const res = await model.generateContent(prompt);
    const text = res.response.text();

    const score = parseFloat(text.match(/score:\s*(-?\d+(\.\d+)?)/)[1]);
    const claim = text.match(/claim:\s*(.*)/)[1];

    if (Math.abs(score) >= 0.5) {
      state.update(claim, score);
    }
  }

  const prediction = state.score() >= 0 ? 1 : 0;

  return {
    statusCode: 200,
    body: JSON.stringify({ prediction, beliefs: state.beliefs })
  };
};
