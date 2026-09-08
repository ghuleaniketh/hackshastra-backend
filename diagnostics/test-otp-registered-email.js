import fetch from 'node-fetch';

const BASE_URL = process.env.BACKEND_URL || 'https://hackshastra-backend.vercel.app';
const ORIGIN = 'https://hackshastra-web.vercel.app';

async function testRegisteredEmail() {
  const registeredEmail = `registered_trainer_${Date.now()}@srmap.edu.in`;

  console.log(`1. Requesting OTP for ${registeredEmail}...`);
  const otpRes = await fetch(`${BASE_URL}/api/registrations/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({
      email: registeredEmail,
      fullName: 'Registered User',
      eventId: 'beyond-the-screen',
    }),
  });
  console.log(`OTP request status: ${otpRes.status}`);

  console.log(`2. Registering participant ${registeredEmail} for beyond-the-screen...`);
  const regRes = await fetch(`${BASE_URL}/api/events/beyond-the-screen/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({
      name: 'Registered User',
      email: registeredEmail,
      phone: '9876543210',
      student_id: 'AP24110010999',
      gender: 'male',
      department: 'CSE',
      year: '2',
      favourite_pokemon: 'charmander',
      college: 'SRM University-AP',
      otpVerified: true,
    }),
  });
  const regBody = await regRes.json();
  console.log(`Register status: ${regRes.status}`, regBody);

  console.log(`3. Now calling POST /api/registrations/otp again for ${registeredEmail} (which is now in DB)...`);
  const otpAgainRes = await fetch(`${BASE_URL}/api/registrations/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({
      email: registeredEmail,
      fullName: 'Registered User',
      eventId: 'beyond-the-screen',
    }),
  });
  const otpAgainBody = await otpAgainRes.json();
  console.log(`OTP second call status: ${otpAgainRes.status}`, otpAgainBody);

  console.log(`4. Calling POST /api/registrations/otp a second time immediately (duplicate) for ${registeredEmail}...`);
  const otpDupRes = await fetch(`${BASE_URL}/api/registrations/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({
      email: registeredEmail,
      fullName: 'Registered User',
      eventId: 'beyond-the-screen',
    }),
  });
  const otpDupBody = await otpDupRes.json();
  console.log(`OTP immediate duplicate call status: ${otpDupRes.status}`, otpDupBody);
}

testRegisteredEmail();
