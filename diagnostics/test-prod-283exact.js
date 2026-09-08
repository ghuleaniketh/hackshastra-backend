const ENDPOINT = 'https://hackshastra-backend.vercel.app/api/registrations/send-pass';
const ORIGIN = 'https://hackshastrasrmuap.dev';

// Construct exactly 283 bytes payload
const payload = {
  email: 'test_student_283@srmap.edu.in',
  registrationId: '550e8400-e29b-41d4-a716-446655440000',
  fullName: 'Ghule Aniketh Trainer AP',
  eventTitle: 'Beyond the Screen 2026',
  passId: 'BTS-TEST1234',
  pokemonName: 'Charmander Flame Partner',
  extraPadding: 'pad1234567890123'
};

async function run() {
  let bodyString = JSON.stringify(payload);
  console.log(`[Exact 283 bytes test] Length: ${Buffer.byteLength(bodyString)} bytes`);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ORIGIN,
        'Accept': 'application/json',
      },
      body: bodyString,
    });

    console.log(`\n--- RESPONSE DETAILS ---`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Access-Control-Allow-Origin: ${res.headers.get('access-control-allow-origin')}`);
    const text = await res.text();
    console.log(`Body: ${text}`);
  } catch (err) {
    console.error(`Fetch error:`, err);
  }
}

run();
