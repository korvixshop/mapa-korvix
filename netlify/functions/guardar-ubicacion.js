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

    // Buscar el pedido en Shopify
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

    if (!shopifyData.orders || shopifyData.orders.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Pedido #${orden_id} no encontrado` })
      };
    }

    const shopify_id = shopifyData.orders[0].id;
    const nota_actual = shopifyData.orders[0].note || '';

    // Actualizar la nota del pedido directamente en Shopify
    const updateRes = await fetch(
      `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders/${shopify_id}.json`,
      {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order: {
            id: shopify_id,
            note: `${nota_actual}\nUbicación de entrega: ${ubicacion}`
          }
        })
      }
    );

    const updateData = await updateRes.json();

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
