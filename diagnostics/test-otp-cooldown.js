import fetch from 'node-fetch';

const BASE_URL = process.env.BACKEND_URL || 'https://hackshastra-backend.vercel.app';
const ENDPOINT = `${BASE_URL}/api/registrations/otp`;
const ORIGIN = 'https://hackshastra-web.vercel.app';

const uniqueEmail = `cooldown_tester_${Date.now()}@srmap.edu.in`;

async function callOtp(label) {
  const start = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({
      email: uniqueEmail,
      fullName: 'Cooldown Tester',
      eventId: 'beyond-the-screen',
    }),
  });
  const body = await res.json();
  const duration = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${label}: HTTP ${res.status} (${duration}ms) =>`, body);
  return { status: res.status, body };
}

async function run() {
  console.log(`Testing 45s cooldown for ${uniqueEmail}...`);
  console.log('\n--- Step 1: Initial OTP Request ---');
  const res1 = await callOtp('Call 1 (Initial)');

  console.log('\n--- Step 2: Immediate Request at t = 2s ---');
  await new Promise(r => setTimeout(r, 2000));
  const res2 = await callOtp('Call 2 (Immediate @ 2s)');

  console.log('\n--- Step 3: Waiting 44 seconds for cooldown to expire... ---');
  await new Promise(r => setTimeout(r, 44000));

  console.log('\n--- Step 4: Resend after cooldown (>45s) ---');
  const res3 = await callOtp('Call 3 (Post-Cooldown @ 46s)');

  console.log('\n--- Summary ---');
  console.log(`Call 1 (Initial): ${res1.status} (Expected 200)`);
  console.log(`Call 2 (Before Cooldown): ${res2.status} (Expected 429)`);
  console.log(`Call 3 (After Cooldown): ${res3.status} (Expected 200)`);
}

run();
