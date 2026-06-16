exports.handler = async function(event) {
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
    const { ubicacion, orden_id } = body;

    if (!ubicacion || !orden_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan datos' }) };
    }

    const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;
    const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

    const query = `
      mutation updateOrderNote($input: OrderInput!) {
        orderUpdate(input: $input) {
          order { id note }
          userErrors { field message }
        }
      }
    `;

    const variables = {
      input: {
        id: `gid://shopify/Order/${orden_id}`,
        note: `📍 UBICACIÓN DE ENTREGA: ${ubicacion}`
      }
    };

    const response = await fetch(
      `https://${SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_TOKEN
        },
        body: JSON.stringify({ query, variables })
      }
    );

    const data = await response.json();
    console.log('Respuesta Shopify:', JSON.stringify(data));

    if (data.errors) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: data.errors }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
