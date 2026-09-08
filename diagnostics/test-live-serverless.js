import fetch from 'node-fetch';

const TARGET_HOSTS = [
  'https://hackshastrasrmuap.dev',
  'https://hackshastra-web.vercel.app',
];

const ENDPOINTS = [
  { path: '/api/otp/request', method: 'POST', body: { email: 'trainer_test@srmap.edu.in', fullName: 'Tester' } },
  { path: '/api/otp/verify', method: 'POST', body: { email: 'trainer_test@srmap.edu.in', otp: '123456' } },
  { path: '/api/mail/send-pass', method: 'POST', body: { email: 'trainer_test@srmap.edu.in', passId: 'BTS-TEST1234' } },
  { path: '/api/contact/otp', method: 'POST', body: { email: 'contact_test@srmap.edu.in' } },
  { path: '/api/contact/verify', method: 'POST', body: { email: 'contact_test@srmap.edu.in', otp: '123456' } },
  { path: '/api/contact/notify', method: 'POST', body: { name: 'Tester', email: 'contact@srmap.edu.in', subject: 'Hello', message: 'Test message' } },
];

async function probeLiveHost(host) {
  console.log(`\n================================================================`);
  console.log(`  Probing Live Host: ${host}`);
  console.log(`================================================================`);

  for (const ep of ENDPOINTS) {
    const url = `${host}${ep.path}`;
    try {
      const res = await fetch(url, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'Origin': host,
          'Accept': 'application/json',
        },
        body: JSON.stringify(ep.body),
      });

      const contentType = res.headers.get('content-type') || '';
      let text = await res.text();
      let isHtml = text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html');

      console.log(`\n[${ep.method} ${ep.path}]`);
      console.log(`   HTTP Status: ${res.status} ${res.statusText}`);
      console.log(`   Content-Type: ${contentType}`);
      if (isHtml) {
        console.log(`   Body: [HTML Single Page App Index Returned - Route Not Yet Live on Edge / Serverless Not Deployed]`);
      } else {
        console.log(`   Body:`, text.substring(0, 300));
      }
    } catch (err) {
      console.error(`   Error fetching ${url}:`, err.message);
    }
  }
}

async function run() {
  for (const host of TARGET_HOSTS) {
    await probeLiveHost(host);
  }
}

run();
