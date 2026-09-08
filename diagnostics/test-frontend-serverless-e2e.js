import assert from 'assert';
import request from 'supertest';
import app from '../src/app.js';

// Import frontend serverless functions directly to test their behavior
import requestOtpHandler from '../../Hackshastra-frontend/api/otp/request.js';
import verifyOtpHandler from '../../Hackshastra-frontend/api/otp/verify.js';
import sendPassHandler from '../../Hackshastra-frontend/api/mail/send-pass.js';

function createMockReqRes(method, body = {}, headers = {}) {
  let statusCode = 200;
  let responseData = null;
  const resHeaders = {};

  const req = {
    method,
    body,
    headers: { origin: 'https://hackshastrasrmuap.dev', ...headers },
  };

  const res = {
    setHeader: (k, v) => { resHeaders[k] = v; },
    status: (code) => { statusCode = code; return res; },
    json: (data) => { responseData = data; return res; },
    end: () => res,
  };

  return { req, res, getResult: () => ({ status: statusCode, body: responseData, headers: resHeaders }) };
}

async function runEndToEndTest() {
  console.log('================================================================');
  console.log('  E2E TEST: Frontend Serverless Functions + Backend Validation');
  console.log('================================================================');

  const testEmail = `e2e_trainer_${Date.now()}@srmap.edu.in`;

  // Step 1: Request OTP from Frontend Serverless function
  console.log(`\n1. Requesting OTP for ${testEmail} via frontend /api/otp/request...`);
  const reqRes1 = createMockReqRes('POST', {
    email: testEmail,
    fullName: 'Ash Ketchum',
    eventTitle: 'Beyond the Screen',
  });
  await requestOtpHandler(reqRes1.req, reqRes1.res);
  const otpReqResult = reqRes1.getResult();
  console.log('   Response:', otpReqResult.status, otpReqResult.body);
  assert(otpReqResult.status === 200, 'Frontend /api/otp/request should return 200');
  assert(otpReqResult.body.success === true, 'Frontend OTP request should be successful');

  // Retrieve the generated OTP from global store for testing
  const storedOtp = globalThis.__HACKSHASTRA_OTP_STORE__.get(testEmail)?.otp;
  console.log(`   Captured cryptographic OTP from serverless store: ${storedOtp}`);
  assert(storedOtp && storedOtp.length === 6, 'Valid 6-digit OTP generated');

  // Step 2: Verify OTP via Frontend Serverless function
  console.log(`\n2. Verifying OTP via frontend /api/otp/verify...`);
  const reqRes2 = createMockReqRes('POST', {
    email: testEmail,
    otp: storedOtp,
  });
  await verifyOtpHandler(reqRes2.req, reqRes2.res);
  const otpVerifyResult = reqRes2.getResult();
  console.log('   Response:', otpVerifyResult.status, otpVerifyResult.body);
  assert(otpVerifyResult.status === 200, 'Frontend /api/otp/verify should return 200');
  assert(otpVerifyResult.body.success === true, 'Frontend OTP verify should succeed');
  const proofToken = otpVerifyResult.body.data?.verificationProofToken;
  assert(proofToken, 'Signed verificationProofToken must be issued');
  console.log(`   Issued verificationProofToken: ${proofToken.substring(0, 32)}...`);

  // Step 3: Submit Registration to Backend with Valid Token
  console.log(`\n3. Submitting registration to Backend with valid verificationProofToken...`);
  const regPayload = {
    name: 'Ash Ketchum',
    email: testEmail,
    phone: '9876543210',
    student_id: 'AP24110010001',
    gender: 'male',
    department: 'CSE',
    year: '2',
    favourite_pokemon: 'pikachu',
    college: 'SRM University-AP',
    verificationProofToken: proofToken,
  };

  const backendRegRes = await request(app)
    .post('/api/events/beyond-the-screen/register')
    .send(regPayload);

  console.log('   Backend Register Response:', backendRegRes.status, backendRegRes.body?.data?.registration?.status);
  assert(backendRegRes.status === 201, 'Backend registration should return 201 Created');
  assert(backendRegRes.body.data.registration.status === 'VERIFIED', 'Registration status must be VERIFIED when valid token is provided');
  console.log('   ✓ PASS: Registration verified and persisted with status = VERIFIED');

  // Step 4: Dispatch Pass Email via Frontend Serverless function
  console.log(`\n4. Dispatching pass email via frontend /api/mail/send-pass...`);
  const reqRes3 = createMockReqRes('POST', {
    email: testEmail,
    fullName: 'Ash Ketchum',
    eventTitle: 'Beyond the Screen',
    passId: `BTS-${backendRegRes.body.data.registration.id.slice(0, 8).toUpperCase()}`,
    pokemonName: 'Pikachu',
  });
  await sendPassHandler(reqRes3.req, reqRes3.res);
  const mailResult = reqRes3.getResult();
  console.log('   Response:', mailResult.status, mailResult.body);
  assert(mailResult.status === 200, 'Frontend /api/mail/send-pass should return 200');
  assert(mailResult.body.success === true, 'Pass email dispatch should succeed');
  console.log('   ✓ PASS: Pass email successfully handled by frontend mail function');

  // Step 5: Security Check - Missing / Fake Token must NOT be VERIFIED
  console.log(`\n5. Security Check: Submitting registration with invalid token...`);
  const unverifiedEmail = `unverified_${Date.now()}@srmap.edu.in`;
  const invalidTokenRes = await request(app)
    .post('/api/events/beyond-the-screen/register')
    .send({
      name: 'Unverified Challenger',
      email: unverifiedEmail,
      phone: '9876543210',
      student_id: 'AP24110010002',
      gender: 'female',
      department: 'ECE',
      year: '1',
      favourite_pokemon: 'charmander',
      college: 'SRM University-AP',
      verificationProofToken: 'fake.invalid.token',
    });

  console.log('   Invalid Token Response Status:', invalidTokenRes.body?.data?.registration?.status);
  assert(invalidTokenRes.body.data.registration.status === 'PENDING_VERIFICATION', 'Registration must remain PENDING_VERIFICATION when invalid token is provided');
  console.log('   ✓ PASS: Backend safely rejected invalid token and set status = PENDING_VERIFICATION');

  console.log('\n================================================================');
  console.log('  ALL E2E INTEGRATION & SECURITY TESTS PASSED PERFECTLY!');
  console.log('================================================================\n');
}

runEndToEndTest();
