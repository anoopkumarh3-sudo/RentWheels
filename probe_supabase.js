const https = require('https');

const apikey = 'sb_publishable_zOCt_lxXxUfDNd8Iu4qe7w_BNfh50CJ';
const host = 'hhknvyvetypclkqsdfkr.supabase.co';

function request(path, method = 'GET', data = null, extraHeaders = {}) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: host,
      path: path,
      method: method,
      headers: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`,
        'Content-Type': 'application/json',
        ...extraHeaders
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', (err) => resolve({ error: err.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log("=== SUPABASE HEALTH & SCHEMA CHECK ===");
  
  // 1. Vehicles
  const vRes = await request('/rest/v1/vehicles?select=*');
  console.log(`\nVehicles: HTTP ${vRes.status}`);
  console.log(vRes.body);

  // 2. Storage Buckets
  const bRes = await request('/storage/v1/bucket');
  console.log(`\nStorage Buckets: HTTP ${bRes.status}`);
  console.log(bRes.body);

  // 3. Profiles
  const pRes = await request('/rest/v1/profiles?select=*&limit=5');
  console.log(`\nProfiles: HTTP ${pRes.status}`);
  console.log(pRes.body);

  // 4. OpenAPI spec (to get all tables and columns)
  const schemaRes = await request('/rest/v1/');
  console.log(`\nOpenAPI Schema: HTTP ${schemaRes.status}`);
  try {
    const schema = JSON.parse(schemaRes.body);
    console.log("Definitions/Tables:", Object.keys(schema.definitions || {}));
    if (schema.definitions && schema.definitions.vehicles) {
      console.log("\nVehicles columns:", Object.keys(schema.definitions.vehicles.properties || {}));
    }
    if (schema.definitions && schema.definitions.bookings) {
      console.log("\nBookings columns:", Object.keys(schema.definitions.bookings.properties || {}));
    }
    if (schema.definitions && schema.definitions.payments) {
      console.log("\nPayments columns:", Object.keys(schema.definitions.payments.properties || {}));
    }
    if (schema.definitions && schema.definitions.profiles) {
      console.log("\nProfiles columns:", Object.keys(schema.definitions.profiles.properties || {}));
    }
  } catch (e) {
    console.log("Failed to parse OpenAPI JSON:", e.message);
  }
}

main();

