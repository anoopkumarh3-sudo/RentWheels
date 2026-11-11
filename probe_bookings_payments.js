const https = require('https');

const apikey = 'sb_publishable_zOCt_lxXxUfDNd8Iu4qe7w_BNfh50CJ';
const host = 'hhknvyvetypclkqsdfkr.supabase.co';

function get(path) {
  return new Promise((resolve) => {
    const req = https.get({
      hostname: host,
      path: path,
      headers: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', (err) => resolve({ error: err.message }));
  });
}

async function checkColumns(table, cols) {
  console.log(`\nChecking table: ${table}`);
  for (const col of cols) {
    const res = await get(`/rest/v1/${table}?select=${col}&limit=1`);
    if (res.status === 200) {
      console.log(`  [OK] ${col}`);
    } else {
      console.log(`  [ERROR/MISSING] ${col}: status ${res.status}`, res.body);
    }
  }
}

async function main() {
  await checkColumns('bookings', [
    'id', 'vehicle_id', 'renter_id', 'start_datetime', 'end_datetime',
    'total_hours', 'total_days', 'total_amount', 'booking_status', 'payment_status',
    'created_at', 'updated_at'
  ]);

  await checkColumns('payments', [
    'id', 'booking_id', 'razorpay_order_id', 'razorpay_payment_id',
    'amount', 'currency', 'payment_status', 'payment_method',
    'created_at', 'updated_at'
  ]);
}

main();

