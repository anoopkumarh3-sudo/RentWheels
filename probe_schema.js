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
  // Check vehicle-images bucket
  const bRes = await request('/storage/v1/bucket/vehicle-images');
  console.log(`\nBucket vehicle-images: HTTP ${bRes.status}`, bRes.body);

  // Check columns of vehicles table by selecting non-existent column to see column error or schema
  const colRes = await request('/rest/v1/vehicles?select=non_existent_column');
  console.log(`\nVehicles non-existent col test: HTTP ${colRes.status}`, colRes.body);

  // Check columns of bookings table
  const bColRes = await request('/rest/v1/bookings?select=non_existent_column');
  console.log(`\nBookings non-existent col test: HTTP ${bColRes.status}`, bColRes.body);

  // Check columns of payments table
  const pColRes = await request('/rest/v1/payments?select=non_existent_column');
  console.log(`\nPayments non-existent col test: HTTP ${pColRes.status}`, pColRes.body);

  // Check columns of profiles table
  const profColRes = await request('/rest/v1/profiles?select=non_existent_column');
  console.log(`\nProfiles non-existent col test: HTTP ${profColRes.status}`, profColRes.body);
}

main();

