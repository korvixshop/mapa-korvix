exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { orden_id, ubicacion } = JSON.parse(event.body);

    let shopify_id = null;
    try {
      const shopifyRes = await fetch(
        `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders.json?name=${orden_id}&status=any&limit=5`,
        {
          headers: {
            'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      const shopifyData = await shopifyRes.json();
      shopify_id = shopifyData.orders && shopifyData.orders.length > 0
        ? shopifyData.orders[0].id
        : `no_encontrado_status_${shopifyRes.status}`;
    } catch(e) {
      shopify_id = `error_${e.message}`;
    }

    await fetch('https://hooks.zapier.com/hooks/catch/27968366/43qynod/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden_id, shopify_id, ubicacion })
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, orden_id, shopify_id })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
