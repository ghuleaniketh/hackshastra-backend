import request from 'supertest';
import app from '../src/app.js';

async function runLocalTest() {
  console.log('Testing /api/registrations/send-pass locally via supertest with lightweight payload...');

  const payload = {
    email: 'test_student@srmap.edu.in',
    registrationId: 'test-uuid-1234',
    fullName: 'Ghule Aniketh',
    eventTitle: 'Beyond the Screen',
    passId: 'BTS-TEST1234',
    pokemonName: 'Charmander',
  };

  const res = await request(app)
    .post('/api/registrations/send-pass')
    .set('Origin', 'https://hackshastra-web.vercel.app')
    .set('Content-Type', 'application/json')
    .send(payload);

  console.log(`\nLocal Supertest Response:`);
  console.log(`Status: ${res.status}`);
  console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
  console.log(`Body:`, res.body);

  if (res.status === 200 && res.headers['access-control-allow-origin']) {
    console.log('\n SUCCESS: 200 OK returned with valid CORS headers.');
  } else {
    console.error('\n FAILED: Unexpected response status or missing CORS headers.');
    process.exit(1);
  }
}

runLocalTest();
