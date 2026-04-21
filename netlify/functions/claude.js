exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY environment variable not set in Netlify dashboard.' } })
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: { message: 'Invalid JSON body' } }) };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':         'application/json',
        'x-api-key':            ANTHROPIC_KEY,
        'anthropic-version':    '2023-06-01',
        'anthropic-beta':       'pdfs-2024-09-25,web-search-2025-03-05'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type':                 'application/json',
        'Access-Control-Allow-Origin':  '*'
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message } })
    };
  }
};
