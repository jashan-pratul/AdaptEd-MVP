import { APICallError, generateText, Output, RetryError } from 'ai';
import { google } from '@ai-sdk/google';
import {
  analysisRequestSchema,
  analysisSchema,
} from '../../../lib/schema';

// Gemini 3.5 Flash-Lite is a current stable Gemini model recommended for new
// low-latency workloads. It is also available to this project's API key.
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

function getApiCallError(error: unknown) {
  if (APICallError.isInstance(error)) {
    return error;
  }

  if (RetryError.isInstance(error) && APICallError.isInstance(error.lastError)) {
    return error.lastError;
  }

  return undefined;
}

function providerErrorResponse(error: unknown) {
  const apiError = getApiCallError(error);

  if (apiError) {
    if (apiError.statusCode === 429) {
      return Response.json(
        {
          error:
            'Gemini request quota is currently exhausted. Please wait a moment, then try again, or check the project’s Gemini billing and quota settings.',
        },
        { status: 429 }
      );
    }

    if (apiError.statusCode === 401 || apiError.statusCode === 403) {
      return Response.json(
        {
          error:
            'Gemini could not authorize this request. Verify that GOOGLE_GENERATIVE_AI_API_KEY belongs to a project with Gemini API access.',
        },
        { status: 502 }
      );
    }

    if (apiError.statusCode === 404) {
      return Response.json(
        {
          error: `The configured Gemini model (${GEMINI_MODEL}) is unavailable to this API project.`,
        },
        { status: 502 }
      );
    }

    if (apiError.statusCode === 503) {
      return Response.json(
        {
          error:
            'Gemini is temporarily unavailable because the model is under high demand. Please try again in a moment.',
        },
        { status: 503 }
      );
    }
  }

  return Response.json(
    {
      error:
        'Gemini could not complete the analysis. Please try again shortly.',
    },
    { status: 502 }
  );
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      {
        error: 'Please send a valid JSON analysis request.',
      },
      { status: 400 }
    );
  }

  const request = analysisRequestSchema.safeParse(body);

  if (!request.success) {
    return Response.json(
      {
        error: 'Please provide a concept, question, and learner answer within the supported length limits.',
      },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) {
    return Response.json(
      {
        error:
          'Gemini is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local and restart the development server.',
      },
      { status: 503 }
    );
  }

  const { concept, question, answer, history } = request.data;
  const currentRound = request.data.round;

  try {
    const { output } = await generateText({
      model: google(GEMINI_MODEL),

      // A failed request should not issue two extra requests against a limited
      // Gemini quota. The UI receives the provider's actionable status instead.
      maxRetries: 0,
      timeout: 45_000,

      output: Output.object({
        schema: analysisSchema
      }),

      system: `
You are the error-aware adaptive learning engine for an educational research prototype.

Your core job is:

ERROR
→ DIAGNOSIS
→ PEDAGOGICAL STRATEGY
→ ADAPTED EXPLANATION
→ NEW TARGETED QUESTION
→ LEARNER RESPONSE
→ RE-DIAGNOSIS

The learner is studying ONE underlying concept.

IMPORTANT:
The concept must remain the same throughout the session.

However, the QUESTION MUST ADAPT based on the learner's latest response.

Do NOT repeatedly ask the same question.

Do NOT simply reword the previous question.

Do NOT always ask "Explain in your own words."

Instead, inspect the learner's latest answer and determine exactly what the learner appears to misunderstand.

Then generate a NEW question that specifically tests that missing understanding.

Example:

Concept: Fractions

Original question:
"What is 1/2 + 1/4?"

Learner:
"2/6"

Possible diagnosis:
"The learner is adding numerators and denominators directly."

Adapted explanation:
Explain that fractions must represent equal-sized pieces before they can be added.

NEW targeted question:
"If a pizza is divided into 4 equal pieces, how many fourths are equal to 1/2?"

If the learner answers that correctly, analyze that new response.

Then the next question should test the next remaining difficulty, for example:

"What is 2/4 + 1/4?"

If the learner demonstrates understanding, a later question may test transfer:

"A chocolate bar is divided into 4 equal pieces. You have 3 pieces and give away 1. What fraction remains?"

The question must evolve based on the learner's latest response.

This is the defining behaviour of the system.

Do NOT diagnose dyslexia, ADHD, autism, or any medical or psychological condition.

Only infer a likely difficulty from the learner's observable response.

CURRENT ROUND:
${currentRound}

Maximum reassessment rounds:
3

Round behaviour:

Round 0:
Analyze the initial learner answer and generate the first targeted reassessment question.

Round 1:
Analyze the learner's answer to the first reassessment.
Identify what changed and generate a new question targeting the remaining difficulty.

Round 2:
Analyze the learner's answer to the second reassessment.
Generate a final transfer/mastery question OR mark mastery if there is strong evidence of understanding.

Round 3:
If strong evidence of understanding exists, mark mastered.
Otherwise mark needs_support.

MASTERY RULE:

Do NOT declare mastery merely because the learner reached a certain round.

Mastery requires evidence from the learner's response.

A learner can be marked mastered when their response demonstrates the underlying concept correctly and they can apply it appropriately.

If the learner remains incorrect or shows a persistent misconception after the available rounds, use needs_support.

QUESTION GENERATION RULES:

1. The new question must remain about the SAME concept.
2. The new question must respond to the learner's latest error.
3. Do not repeat the previous question.
4. Do not merely change a few words.
5. Increase or decrease scaffolding depending on the learner's performance.
6. If the learner improves, gradually move toward independent application.
7. If the learner continues making the same error, change the teaching representation.
8. If the learner demonstrates understanding, test transfer to a new context.
9. The question must be appropriate for the concept provided by the user.
10. Never invent a medical diagnosis.

Previous attempt history:

${JSON.stringify(history).slice(0, 12000)}
`,

      prompt: `
Concept:
${concept}

Current question:
${question}

Latest learner response:
${answer}

Current reassessment round:
${currentRound}

Analyze ONLY the evidence available in the learner's latest response.

Then:

1. Identify the likely difficulty.
2. Explain why you think that difficulty exists.
3. Select an appropriate pedagogical strategy.
4. Change HOW the concept is represented.
5. Generate a NEW targeted reassessment question.
6. Decide whether the learner has demonstrated mastery.
`
    });

    // Output.object requests Gemini structured JSON; parse again at the
    // application boundary so no unvalidated model response reaches the UI.
    const analysis = analysisSchema.parse(output);

    return Response.json({
      ...analysis,
      nextRound: currentRound + 1
    });

  } catch (error) {
    // Do not log request bodies: they contain learner data. The provider error
    // response is intentionally mapped to a safe, user-actionable message.
    const apiError = getApiCallError(error);
    console.error(
      `Gemini analysis failed: ${
        apiError
          ? `API status ${apiError.statusCode ?? 'unknown'}`
          : error instanceof Error
            ? error.name
            : 'UnknownError'
      }`
    );

    return providerErrorResponse(error);
  }
}
