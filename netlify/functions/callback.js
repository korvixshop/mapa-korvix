exports.handler = async function(event) {
  const { code, shop } = event.queryStringParameters;
  
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: '78878bd1ec6b0d6acf04d2b26f01ab62',
      client_secret: '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',
      code: code
    })
  });
  
  const data = await response.json();
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
};
