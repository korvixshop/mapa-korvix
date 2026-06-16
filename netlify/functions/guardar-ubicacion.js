exports.handler = async function(event, context) {
  // Solo aceptar POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Headers CORS para que el mapa pueda llamar a esta función
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { ubicacion, orden_id } = body;

    if (!ubicacion || !orden_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Faltan datos: ubicacion u orden_id' })
      };
    }

    const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;
    const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

    // Actualizar las notas del pedido en Shopify
    const response = await fetch(
      `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders/${orden_id}.json`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_TOKEN
        },
        body: JSON.stringify({
          order: {
            id: orden_id,
            note: `📍 UBICACIÓN DE ENTREGA: ${ubicacion}`
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Error Shopify:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al guardar en Shopify' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, mensaje: 'Ubicación guardada en el pedido' })
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
