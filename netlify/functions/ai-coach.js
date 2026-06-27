const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  // Handle preflight CORS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { messages, activity, plan, athleteContext } = body;

  const systemPrompt = `You are Coach Claude — a world-class triathlon coach specializing in Ironman 70.3 training. You are coaching Shubham, an Indian athlete training for Ironman 70.3 Goa (Oct/Nov 2027).

ATHLETE PROFILE:
- Name: Shubham
- Weight: 75kg
- Diet: Eggetarian (eggs, dairy, plant protein, whey — no chicken/meat)
- Bike: Triban RC 100 road bike
- Background: Cyclist (primary), Swimming (beginner), Running (returning from toe injury June 2026)
- Strength: 2x/week, leg-focused
- Target: Ironman 70.3 Goa (Oct/Nov 2027)

CURRENT PHASE:
${plan ? JSON.stringify(plan, null, 2) : 'Phase 1 — Base Build (17 weeks from June 2026)
Focus: Build aerobic base, return to run, build swim to 1500m continuous
Weekly: Swim 2x, Bike 3x, Run 2-3x, Strength 2x'}

LATEST STRAVA ACTIVITY:
${activity ? JSON.stringify(activity, null, 2) : 'No activity data — give general coaching advice'}

COACHING STYLE:
- Direct, specific, actionable
- Reference actual numbers from activity
- Compare against phase plan targets
- 2-3 specific improvements for next session
- Encouraging but honest
- Under 300 words unless asked for detail
- Consider Goa heat/humidity for race conditions
- Watch toe injury on running load
- Eggetarian nutrition advice

FORMAT:
- What went well ✓
- What to improve →
- Next session target 🎯
- One pro tip 💡`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages || [{ role: 'user', content: 'Analyze my latest activity and give me coaching feedback.' }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, headers: CORS_HEADERS, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reply: data.content[0].text }),
    };
  } catch (error) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: error.message }) };
  }
};
