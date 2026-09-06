import request from 'supertest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('====================================================');
console.log('  HackShastra — Beyond the Screen Registration Test');
console.log('====================================================\n');

async function runRegistrationTests() {
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failedCount++;
    }
  };

  try {
    // 1. Submit Registration for Beyond the Screen
    const regRes = await request(app)
      .post('/api/events/beyond-the-screen/register')
      .send({
        fullName: 'Ash Ketchum',
        studentId: 'AP24110010999',
        gender: 'Male',
        email: 'ash.ketchum@srmap.edu.in',
        contactNumber: '+91 9876543210',
        department: 'CSE',
        year: '2nd Year',
        favouritePokemon: 'squirtle',
        participationInterest: 'yes',
        college: 'SRM University-AP',
      });

    assert(
      regRes.status === 201 && regRes.body.success === true,
      `POST /api/events/beyond-the-screen/register succeeds (status ${regRes.status})`
    );

    assert(
      regRes.body.data && regRes.body.data.registration,
      'Registration payload returned with registration record'
    );

    const regData = regRes.body.data?.registration || {};
    assert(
      regData.full_name === 'Ash Ketchum' &&
      regData.favourite_pokemon === 'squirtle' &&
      regData.participation_interest === 'yes',
      'Structured Pokemon fields stored and returned correctly'
    );

    // 2. Duplicate Registration Test
    const dupRes = await request(app)
      .post('/api/events/beyond-the-screen/register')
      .send({
        fullName: 'Ash Ketchum',
        studentId: 'AP24110010999',
        gender: 'Male',
        email: 'ash.ketchum@srmap.edu.in',
        contactNumber: '+91 9876543210',
        department: 'CSE',
        year: '2nd Year',
        favouritePokemon: 'squirtle',
        participationInterest: 'yes',
      });

    assert(
      dupRes.status === 409,
      `Duplicate registration returns 409 Conflict (got ${dupRes.status})`
    );

    // 3. Admin View Registrations for Beyond the Screen
    const adminJwt = generateToken({ id: 'admin-uuid-1', email: 'admin@hackshastra.org', role: 'ADMIN' });
    const adminRegRes = await request(app)
      .get('/api/admin/events/beyond-the-screen/registrations')
      .set('Authorization', `Bearer ${adminJwt}`);

    assert(
      adminRegRes.status === 200 && adminRegRes.body.success === true,
      `GET /api/admin/events/beyond-the-screen/registrations succeeds with 200`
    );

  } catch (error) {
    console.error('Fatal error during registration tests:', error);
    process.exit(1);
  }

  console.log(`\n----------------------------------------------------`);
  console.log(`  Test Results: ${passedCount} Passed, ${failedCount} Failed`);
  console.log(`----------------------------------------------------`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRegistrationTests();
