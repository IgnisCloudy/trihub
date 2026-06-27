exports.handler = async (event) => {
  const { code } = event.queryStringParameters || {};

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No authorization code provided' }),
    };
  }

  const clientId = '246568';
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing STRAVA_CLIENT_SECRET' }),
    };
  }

  try {
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: tokenData.error }),
      };
    }

    // Redirect back to TriHub with token in URL
    const redirectUrl = `https://igniscloudy.netlify.app/?accessToken=${tokenData.access_token}&athlete=${encodeURIComponent(tokenData.athlete.firstname + ' ' + tokenData.athlete.lastname)}`;

    return {
      statusCode: 301,
      headers: {
        Location: redirectUrl,
      },
      body: '',
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
