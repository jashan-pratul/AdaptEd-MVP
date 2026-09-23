# AdaptEd — Error-Aware Adaptive Learning

MVP for IP_PS-31 · Team 9.

## Core loop
Any concept → learner answer → error analysis → pedagogical strategy → new representation → reassessment → repeat until mastery, capped at 3 reassessment rounds.

## Run locally

```bash
npm install
cp .env.example .env.local
# add GOOGLE_GENERATIVE_AI_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000.

The app only uses Gemini responses. It will show a configuration error if the
key is missing, or an actionable quota error if the provider rejects a request.

## Safety
This is a research prototype, not a medical or learning-disability diagnostic tool. AI outputs should be reviewed by educators.
