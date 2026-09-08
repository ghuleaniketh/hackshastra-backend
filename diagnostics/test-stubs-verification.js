import request from 'supertest';
import app from '../src/app.js';

async function testAllStubs() {
  console.log('Testing stubbed endpoints locally...');

  // 1. POST /api/registrations/otp
  const otpRes = await request(app)
    .post('/api/registrations/otp')
    .send({ email: 'student@srmap.edu.in', fullName: 'Tester' });
  console.log('1. POST /api/registrations/otp:', otpRes.status, otpRes.body);

  // 2. POST /api/registrations/verify-otp
  const verifyRes = await request(app)
    .post('/api/registrations/verify-otp')
    .send({ email: 'student@srmap.edu.in', otp: '123456' });
  console.log('2. POST /api/registrations/verify-otp:', verifyRes.status, verifyRes.body);

  // 3. POST /api/registrations/send-pass
  const sendPassRes = await request(app)
    .post('/api/registrations/send-pass')
    .send({ email: 'student@srmap.edu.in', passId: 'BTS-1234' });
  console.log('3. POST /api/registrations/send-pass:', sendPassRes.status, sendPassRes.body);

  // 4. POST /api/contact/otp
  const contactOtpRes = await request(app)
    .post('/api/contact/otp')
    .send({ email: 'contact@srmap.edu.in' });
  console.log('4. POST /api/contact/otp:', contactOtpRes.status, contactOtpRes.body);

  // 5. POST /api/contact/verify
  const contactVerifyRes = await request(app)
    .post('/api/contact/verify')
    .send({ email: 'contact@srmap.edu.in', otp: '123456' });
  console.log('5. POST /api/contact/verify:', contactVerifyRes.status, contactVerifyRes.body);

  // 6. POST /api/events/beyond-the-screen/register (Direct registration without requiring real OTP)
  const regRes = await request(app)
    .post('/api/events/beyond-the-screen/register')
    .send({
      name: 'Direct Reg Trainer',
      email: `direct_trainer_${Date.now()}@srmap.edu.in`,
      phone: '9876543210',
      student_id: 'AP24110010999',
      gender: 'male',
      department: 'CSE',
      year: '2',
      favourite_pokemon: 'bulbasaur',
      college: 'SRM University-AP',
    });
  console.log('6. POST /api/events/beyond-the-screen/register:', regRes.status, regRes.body);
}

testAllStubs();
