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
    const { orden_id, ubicacion_url, latitud, longitud } = JSON.parse(event.body);

    // Buscar ID interno de Shopify
    let shopify_id = null;
    try {
      const shopifyRes = await fetch(
       `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders.json?name=${orden_id}&status=any`,
        {
          headers: {
            'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
      const shopifyData = await shopifyRes.json();
      if (shopifyData.orders && shopifyData.orders.length > 0) {
        shopify_id = shopifyData.orders[0].id;
      }
    } catch(e) {
      shopify_id = 'error_consultando_shopify';
    }

    // Enviar a Zapier siempre, con o sin shopify_id
    await fetch('https://hooks.zapier.com/hooks/catch/27968366/43qynod/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orden_id, shopify_id, ubicacion_url, latitud, longitud })
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
