exports.handler = async (event) => {
  const { accessToken, perPage = 20 } = event.queryStringParameters || {};

  if (!accessToken) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No access token provided' }),
    };
  }

  try {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to fetch activities' }),
      };
    }

    const activities = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(activities),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
