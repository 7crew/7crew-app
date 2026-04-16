exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not set.' } })
    };
  }

  try {
    const body = JSON.parse(event.body);

    const request = {
      model: body.model || 'claude-sonnet-4-20250514',
      max_tokens: body.max_tokens || 2000,
      messages: body.messages
    };
    if (body.system) request.system = body.system;

    const hasWebSearch = body.tools && body.tools.some(function(t) {
      return t.type === 'web_search_20250305';
    });
    if (body.tools && body.tools.length > 0) request.tools = body.tools;

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };
    if (hasWebSearch) {
      headers['anthropic-beta'] = 'web-search-2025-03-05';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(request)
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }

    // Surface the full Anthropic error so we can see it
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: 'Anthropic error ' + response.status + ': ' + JSON.stringify(data)
          }
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'Function error: ' + err.message } })
    };
  }
};
