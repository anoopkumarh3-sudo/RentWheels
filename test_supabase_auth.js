const { createClient } = require('./frontend/node_modules/@supabase/supabase-js');

const supabaseUrl = 'https://hhknvyvetypclkqsdfkr.supabase.co';
const supabaseKey = 'sb_publishable_zOCt_lxXxUfDNd8Iu4qe7w_BNfh50CJ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("=== Testing Live Supabase Operations (Part 2) ===");

  // 1. Test image upload to vehicle-images with jpeg
  // 1x1 transparent PNG buffer
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  
  const testFileName = `anon_test_${Date.now()}.png`;
  const { data: upData, error: upErr } = await supabase.storage
    .from('vehicle-images')
    .upload(testFileName, pngBuffer, { contentType: 'image/png' });
  console.log("1. Anon upload PNG result:", { upData, error: upErr?.message });

  // 2. Test signUp with @gmail.com or @example.com
  const testEmail = `rentwheels_tester_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!@#';
  console.log(`\n2. Attempting signUp for ${testEmail}...`);
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Tester A',
        phone: '+919876543210'
      }
    }
  });

  if (authErr) {
    console.log("   signUp error:", authErr.message);
    return;
  }

  console.log("   signUp success! User ID:", authData.user?.id);
  console.log("   Session present?", !!authData.session);
  console.log("   User identities:", authData.user?.identities);

  if (authData.session) {
    console.log("\n3. Active session obtained!");
    const authClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
    });

    // Test upload as authenticated user
    const userFilePath = `${authData.user.id}/test_${Date.now()}.png`;
    const { data: userUp, error: userUpErr } = await authClient.storage
      .from('vehicle-images')
      .upload(userFilePath, pngBuffer, { contentType: 'image/png' });
    console.log("   Authenticated upload result:", { userUp, error: userUpErr?.message });

    if (userUp) {
      const { data: pubUrl } = authClient.storage.from('vehicle-images').getPublicUrl(userUp.path);
      console.log("   Public URL:", pubUrl.publicUrl);
    }

    // Test profile fetch
    const { data: pData, error: pErr } = await authClient
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id);
    console.log("\n4. Profile query:", { pData, error: pErr?.message });

    // Test profile insert
    if (!pData || pData.length === 0) {
      const { data: pIns, error: pInsErr } = await authClient
        .from('profiles')
        .insert([{
          id: authData.user.id,
          full_name: 'Tester A',
          email: testEmail,
          phone: '+919876543210'
        }])
        .select();
      console.log("   Profile insert result:", { pIns, error: pInsErr?.message });
    }

    // Test vehicle insert
    const { data: vIns, error: vInsErr } = await authClient
      .from('vehicles')
      .insert([{
        owner_id: authData.user.id,
        brand: 'Maruti',
        model: 'Swift',
        vehicle_type: 'car',
        registration_number: 'KA-05-MJ-9999',
        hourly_price: 120,
        daily_price: 1200,
        pickup_location: 'Indiranagar, Bengaluru',
        description: JSON.stringify({
          text: 'Super clean hatchback',
          images: []
        }),
        availability_status: 'available'
      }])
      .select();
    console.log("\n5. Vehicle insert result:", { vIns, error: vInsErr?.message });

    // Test querying vehicles as creator
    const { data: myVehicles, error: myVehiclesErr } = await authClient
      .from('vehicles')
      .select('*')
      .eq('owner_id', authData.user.id);
    console.log("\n6. My vehicles query result count:", myVehicles?.length, "error:", myVehiclesErr?.message);
    if (myVehicles && myVehicles.length > 0) {
      console.log("   Vehicle ID:", myVehicles[0].id);
    }

    // Now test if a SECOND user can see the vehicle!
    const user2Email = `rentwheels_tester2_${Date.now()}@gmail.com`;
    console.log(`\n7. Registering User B (${user2Email})...`);
    const { data: auth2Data } = await supabase.auth.signUp({
      email: user2Email,
      password: testPassword
    });

    if (auth2Data?.session) {
      const auth2Client = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${auth2Data.session.access_token}` } }
      });
      const { data: user2SeeVehicles, error: user2Err } = await auth2Client
        .from('vehicles')
        .select('*');
      console.log("   User B query 'vehicles' select * result count:", user2SeeVehicles?.length, "error:", user2Err?.message);
    }
  } else {
    console.log("\n   Session was null - email confirmation is required by this Supabase project!");
  }
}

test().catch(console.error);
