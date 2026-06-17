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

    // Buscar el ID interno de Shopify usando el número de orden
    const shopifyRes = await fetch(
      `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders.json?name=%23${orden_id}&status=any`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    const shopifyData = await shopifyRes.json();
    const orders = shopifyData.orders;

    if (!orders || orders.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No se encontró el pedido #${orden_id}` })
      };
    }

    const shopify_id = orders[0].id;

    // Enviar a Zapier con el ID interno largo
    await fetch('https://hooks.zapier.com/hooks/catch/27968366/43qynod/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orden_id,
        shopify_id,
        ubicacion_url,
        latitud,
        longitud
      })
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
