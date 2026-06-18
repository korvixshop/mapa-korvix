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
    const body = JSON.parse(event.body);
    console.log('Body recibido:', JSON.stringify(body));

    const { orden_id, ubicacion } = body;
    console.log('orden_id:', orden_id, '| ubicacion:', ubicacion);

    const url = `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders.json?name=%23${orden_id}&status=any&limit=5`;
    console.log('URL Shopify:', url);

    const shopifyRes = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    console.log('Shopify status:', shopifyRes.status);
    const shopifyData = await shopifyRes.json();
    console.log('Shopify data:', JSON.stringify(shopifyData));

    if (!shopifyData.orders || shopifyData.orders.length === 0) {
      console.log('Pedido no encontrado');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Pedido #${orden_id} no encontrado` })
      };
    }

    const shopify_id = shopifyData.orders[0].id;
    const nota_actual = shopifyData.orders[0].note || '';
    console.log('shopify_id:', shopify_id, '| nota_actual:', nota_actual);

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
            note: nota_actual
              ? `${nota_actual}\nUbicación GPS: ${ubicacion}`
              : `Ubicación GPS: ${ubicacion}`
          }
        })
      }
    );

    console.log('Update status:', updateRes.status);
    const updateData = await updateRes.json();
    console.log('Update response:', JSON.stringify(updateData));

    if (!updateRes.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al actualizar pedido', detalle: updateData })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, mensaje: `Ubicación guardada en pedido #${orden_id}` })
    };

  } catch (err) {
    console.log('Error catch:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno', detalle: err.message })
    };
  }
};
