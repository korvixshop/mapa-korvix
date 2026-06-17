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
    const shopifyRes = await fetch(
      `https://${process.env.SHOPIFY_STORE}.myshopify.com/admin/api/2024-01/orders.json?name=%23${orden_id}&status=any&limit=5`,
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
            note:
