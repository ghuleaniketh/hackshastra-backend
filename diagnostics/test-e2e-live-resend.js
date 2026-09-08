const BACKEND_URL = 'https://hackshastra-backend.vercel.app/api/registrations/send-pass';
const ALLOWED_ORIGIN = 'https://hackshastrasrmuap.dev';
const VERCEL_APP_ORIGIN = 'https://hackshastra-web.vercel.app';

const payload = {
  email: 'test_student_e2e@srmap.edu.in',
  registrationId: '550e8400-e29b-41d4-a716-446655440000',
  fullName: 'Ghule Aniketh Trainer',
  eventTitle: 'Beyond the Screen',
  passId: 'BTS-E2E2026',
  pokemonName: 'Charmander',
};

async function testOrigin(origin) {
  console.log(`\n========================================`);
  console.log(`Testing Live Dispatch from Origin: ${origin}`);
  console.log(`Payload: ${JSON.stringify(payload)}`);
  console.log(`Payload Size: ${Buffer.byteLength(JSON.stringify(payload))} bytes`);
  console.log(`========================================`);

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': origin,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Access-Control-Allow-Origin: ${res.headers.get('access-control-allow-origin')}`);
    console.log(`Access-Control-Allow-Credentials: ${res.headers.get('access-control-allow-credentials')}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
    
    const body = await res.json();
    console.log(`Response Body:`, JSON.stringify(body, null, 2));

    if (res.status === 200 && body.success) {
      console.log(`\n SUCCESS: 200 OK received. Email successfully dispatched with provider: ${body.data?.provider || 'smtp'}.`);
    } else {
      console.error(`\n FAILED: Unexpected response.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Fetch error:`, err);
    process.exit(1);
  }
}

async function run() {
  await testOrigin(ALLOWED_ORIGIN);
  await testOrigin(VERCEL_APP_ORIGIN);
}

run();
