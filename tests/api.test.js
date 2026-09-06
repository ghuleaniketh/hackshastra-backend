import request from 'supertest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('====================================================');
console.log('  HackShastra Backend — Automated API Integration Test');
console.log('====================================================\n');

async function runApiTests() {
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
    // 1. Health Endpoint
    const healthRes = await request(app).get('/api/health');
    assert(healthRes.status === 200 && healthRes.body.success === true, 'GET /api/health returns 200 OK');

    // 2. Public Events Listing
    const eventsRes = await request(app).get('/api/events');
    assert(eventsRes.status === 200 && eventsRes.body.success === true, 'GET /api/events returns 200 OK');

    // 3. Public Blogs Listing
    const blogsRes = await request(app).get('/api/blogs');
    assert(blogsRes.status === 200 && blogsRes.body.success === true, 'GET /api/blogs returns 200 OK');

    // 4. Public Showcase Projects
    const projectsRes = await request(app).get('/api/projects');
    assert(projectsRes.status === 200 && projectsRes.body.success === true, 'GET /api/projects returns 200 OK');

    // 5. Contact Form OTP Request
    const contactOtpRes = await request(app)
      .post('/api/contact/otp')
      .send({
        name: 'Test Visitor',
        email: 'visitor_test@example.com',
        subject: 'General Question',
        message: 'Hello HackShastra team!',
      });
    assert(contactOtpRes.status === 200 && contactOtpRes.body.success === true, 'POST /api/contact/otp dispatches contact OTP');

    // 6. Google Auth Login (Mock token in dev mode)
    const authRes = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'mock_google_token_testuser@example.com' });
    assert(authRes.status === 200 && authRes.body.data.token, 'POST /api/auth/google returns JWT session token');

    const memberToken = authRes.body.data.token;

    // 7. Protected Profile Endpoint (With Token)
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${memberToken}`);
    assert(meRes.status === 200 && meRes.body.data && meRes.body.data.id, 'GET /api/auth/me returns authenticated profile');

    // 8. Protected Admin Endpoint (With MEMBER Token -> Expect 403 Forbidden or 200 if role is ADMIN in mock)
    const memberJwt = generateToken({ id: 'member-uuid-1', email: 'member@hackshastra.org', role: 'MEMBER' });
    const memberAccessRes = await request(app)
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${memberJwt}`);
    assert(memberAccessRes.status === 403, 'GET /api/admin/events blocks MEMBER role with 403 Forbidden');

    // 9. Protected Admin Endpoint (With ADMIN Token -> Expect 200 OK)
    const adminJwt = generateToken({ id: 'admin-uuid-1', email: 'admin@hackshastra.org', role: 'ADMIN' });
    const adminAccessRes = await request(app)
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${adminJwt}`);
    assert(adminAccessRes.status === 200, 'GET /api/admin/events grants ADMIN role access with 200 OK');

    // 10. Direct Upload Image Session
    const imgRes = await request(app).post('/api/images/upload-url');
    assert(imgRes.status === 200 && imgRes.body.data.uploadUrl, 'POST /api/images/upload-url generates direct upload URL');

    // 11. Event Registration OTP Request (Empty email rejection test)
    const emptyEmailRes = await request(app)
      .post('/api/registrations/otp')
      .send({ email: '', fullName: 'Ash Ketchum' });
    assert(emptyEmailRes.status === 400, 'POST /api/registrations/otp rejects empty email with 400 Bad Request');

    // 12. Event Registration OTP Request (@srmap.edu.in domain rejection test)
    const invalidDomainRes = await request(app)
      .post('/api/registrations/otp')
      .send({ email: 'trainer@gmail.com', fullName: 'Ash Ketchum' });
    assert(invalidDomainRes.status === 400, 'POST /api/registrations/otp rejects non-srmap email with 400 Bad Request');

    // 13. Event Registration OTP Request (Valid @srmap.edu.in)
    const uniqueEmail = `trainer_${Date.now()}@srmap.edu.in`;
    const validOtpRes = await request(app)
      .post('/api/registrations/otp')
      .send({ email: uniqueEmail, fullName: 'Ash Ketchum', eventId: 'beyond-the-screen' });
    assert(validOtpRes.status === 200 && validOtpRes.body.success === true, 'POST /api/registrations/otp sends 6-digit OTP for @srmap.edu.in');

    // 14. Event Registration OTP Verification (Invalid OTP code)
    const invalidVerifyRes = await request(app)
      .post('/api/registrations/verify-otp')
      .send({ email: uniqueEmail, otp: '000000' });
    assert(invalidVerifyRes.status === 400, 'POST /api/registrations/verify-otp rejects invalid code with 400 Bad Request');

    // 15. Event Registration Direct Submission & Persistence Test
    const regRes = await request(app)
      .post('/api/events/beyond-the-screen/register')
      .send({
        fullName: 'Ash Ketchum',
        name: 'Ash Ketchum',
        email: uniqueEmail,
        phone: '9876543210',
        student_id: 'AP24110010999',
        gender: 'Male',
        department: 'Computer Science & Engineering',
        year: '2nd Year',
        favourite_pokemon: 'charmander',
        participation_interest: 'yes',
        college: 'SRM University-AP',
        otpVerified: true,
      });
    assert(regRes.status === 201 && regRes.body.data && regRes.body.data.registration, 'POST /api/events/:id/register registers trainer and persists in DB');

    // 16. Duplicate Registration Detection Test (Same Email)
    const dupRegRes = await request(app)
      .post('/api/events/beyond-the-screen/register')
      .send({
        fullName: 'Ash Ketchum',
        name: 'Ash Ketchum',
        email: uniqueEmail,
        phone: '9876543210',
        student_id: 'AP24110010999',
        gender: 'Male',
        department: 'Computer Science & Engineering',
        year: '2nd Year',
        favourite_pokemon: 'charmander',
        participation_interest: 'yes',
        college: 'SRM University-AP',
        otpVerified: true,
      });
    assert(dupRegRes.status === 409, 'POST /api/events/:id/register prevents duplicate registration with 409 Conflict');

  } catch (error) {
    console.error('Fatal error during integration tests:', error);
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

runApiTests();
