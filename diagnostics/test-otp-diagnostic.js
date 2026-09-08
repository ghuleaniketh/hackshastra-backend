import fetch from 'node-fetch';

const BASE_URL = process.env.BACKEND_URL || 'https://hackshastra-backend.vercel.app';
const ENDPOINT = `${BASE_URL}/api/registrations/otp`;
const ORIGIN = 'https://hackshastra-web.vercel.app';

// Generate a random fresh email for the test
const uniqueId = Date.now();
const freshEmail = `diagnose_trainer_${uniqueId}@srmap.edu.in`;

async function callOtp(email, label) {
  const payload = {
    email,
    fullName: 'Diagnostic Trainer',
    eventId: 'beyond-the-screen',
  };

  const startTime = Date.now();
  console.log(`\n[${new Date().toISOString()}] ---> Dispatched ${label} to ${ENDPOINT} for ${email}`);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ORIGIN,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const elapsed = Date.now() - startTime;
    const body = await res.json().catch(async () => await res.text());

    console.log(`[${new Date().toISOString()}] <--- ${label} Response (${elapsed}ms):`);
    console.log(`   HTTP Status: ${res.status} ${res.statusText}`);
    console.log(`   Headers:`, {
      'content-type': res.headers.get('content-type'),
      'retry-after': res.headers.get('retry-after'),
      'ratelimit-remaining': res.headers.get('ratelimit-remaining'),
      'ratelimit-reset': res.headers.get('ratelimit-reset'),
    });
    console.log(`   Body:`, JSON.stringify(body, null, 2));

    return { status: res.status, body, elapsed };
  } catch (err) {
    console.error(`[${label}] Network/Fetch Error:`, err.message);
    return { status: 0, error: err.message };
  }
}

async function runDiagnostics() {
  console.log('================================================================');
  console.log('  TEST 1: Immediate Back-to-Back OTP Calls (Fresh Email)');
  console.log('================================================================');
  
  const res1 = await callOtp(freshEmail, 'CALL #1 (Initial)');
  const res2 = await callOtp(freshEmail, 'CALL #2 (Immediate Duplicate)');

  console.log('\n--- Analysis of Test 1 ---');
  console.log(`Call 1 Status: ${res1.status}`);
  console.log(`Call 2 Status: ${res2.status}`);
  console.log(`Call 2 Body Message: ${res2.body?.message}`);

  console.log('\n================================================================');
  console.log('  TEST 2: Call OTP for an Already Registered Email');
  console.log('================================================================');
  // Check known email or registered email
  const registeredEmail = 'test_student@srmap.edu.in';
  const resDup = await callOtp(registeredEmail, 'CALL #3 (Registered Email)');
  console.log('\n--- Analysis of Test 2 ---');
  console.log(`Registered Email Status: ${resDup.status}`);
  console.log(`Registered Email Body Message: ${resDup.body?.message}`);
}

runDiagnostics();
