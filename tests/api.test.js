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

    // 5. Public Contact Form Submission
    const contactRes = await request(app)
      .post('/api/contact')
      .send({
        name: 'Test Visitor',
        email: 'visitor@example.com',
        subject: 'General Question',
        message: 'Hello HackShastra team!',
      });
    assert(contactRes.status === 201 && contactRes.body.success === true, 'POST /api/contact submits contact request');

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

    // 8. Protected Admin Endpoint (With MEMBER Token -> Expect 403 Forbidden)
    const adminRes = await request(app)
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${memberToken}`);
    assert(adminRes.status === 403, 'GET /api/admin/events blocks MEMBER role with 403 Forbidden');

    // 9. Protected Admin Endpoint (With ADMIN Token -> Expect 200 OK)
    const adminJwt = generateToken({ id: 'admin-uuid-1', email: 'admin@hackshastra.org', role: 'ADMIN' });
    const adminAccessRes = await request(app)
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${adminJwt}`);
    assert(adminAccessRes.status === 200, 'GET /api/admin/events grants ADMIN role access with 200 OK');

    // 10. Direct Upload Image Session
    const imgRes = await request(app).post('/api/images/upload-url');
    assert(imgRes.status === 200 && imgRes.body.data.uploadUrl, 'POST /api/images/upload-url generates direct upload URL');

  } catch (error) {
    console.error('Fatal error during integration tests:', error);
    process.exit(1);
  }

  console.log(`\n----------------------------------------------------`);
  console.log(`  Test Results: ${passedCount} Passed, ${failedCount} Failed`);
  console.log(`----------------------------------------------------`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runApiTests();
