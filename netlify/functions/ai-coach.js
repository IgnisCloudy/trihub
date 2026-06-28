const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY' }) };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  var messages = body.messages || [{ role: 'user', content: 'Give me coaching advice for my triathlon training.' }];
  var activity = body.activity || null;
  var plan = body.plan || null;

  var activityText = activity ? JSON.stringify(activity) : 'No activity data provided';
  var planText = plan ? JSON.stringify(plan) : 'Phase 1 - Base Build. Swim 2x, Bike 3x, Run 2-3x, Strength 2x per week.';

  var systemPrompt = 'You are Coach Claude, a triathlon coach for Ironman 70.3 training. You are coaching Shubham, an Indian athlete targeting Ironman 70.3 Goa in Oct/Nov 2027. Athlete details: Weight 75kg, eggetarian diet (eggs, dairy, whey protein, no meat), Triban RC 100 bike, returning from toe injury June 2026, beginner swimmer, experienced cyclist, strength training 2x per week. Current phase: ' + planText + '. Latest activity: ' + activityText + '. Give direct, specific, actionable coaching feedback. Format: what went well, what to improve, next session target, one pro tip. Keep under 300 words.';

  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      var errText = await response.text();
      return { statusCode: response.status, headers: CORS, body: JSON.stringify({ error: errText }) };
    }

    var data = await response.json();
    var reply = data.content[0].text;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ reply: reply }) };

  } catch(err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
