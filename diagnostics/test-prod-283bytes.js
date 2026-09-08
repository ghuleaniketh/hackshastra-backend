const ENDPOINT = 'https://hackshastra-backend.vercel.app/api/registrations/send-pass';
const ORIGIN = 'https://hackshastrasrmuap.dev';

const payload = {
  email: 'test_student@srmap.edu.in',
  registrationId: 'test-uuid-1234',
  fullName: 'Ghule Aniketh',
  eventTitle: 'Beyond the Screen',
  passId: 'BTS-TEST1234',
  pokemonName: 'Charmander',
};

async function run() {
  const bodyString = JSON.stringify(payload);
  console.log(`[Test Step 6] Payload: ${bodyString}`);
  console.log(`Content-Length: ${Buffer.byteLength(bodyString)} bytes`);
  console.log(`Sending POST to ${ENDPOINT} with Origin: ${ORIGIN}...`);

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
    console.log(`Headers:`);
    res.headers.forEach((val, key) => {
      console.log(`  ${key}: ${val}`);
    });

    const text = await res.text();
    console.log(`\nBody:\n${text}`);
  } catch (err) {
    console.error(`Fetch error:`, err);
  }
}

run();
