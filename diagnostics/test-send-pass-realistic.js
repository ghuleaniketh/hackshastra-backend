const ENDPOINT = 'https://hackshastra-backend.vercel.app/api/registrations/send-pass';
const ORIGIN = 'https://hackshastra-web.vercel.app';

// Generate ~200KB base64 string to simulate lightweight PNG/JPEG card data URL
const dummyBase64Image = 'data:image/jpeg;base64,' + 'A'.repeat(250 * 1024);
// Generate ~300KB base64 string to simulate PDF data URL
const dummyBase64Pdf = 'data:application/pdf;base64,' + 'B'.repeat(350 * 1024);

const payload = {
  email: 'test_student@srmap.edu.in',
  fullName: 'Ghule Aniketh',
  eventTitle: 'Beyond the Screen',
  passId: 'BTS-TEST1234',
  pokemonName: 'Charmander',
  imageDataUrl: dummyBase64Image,
  pdfDataUrl: dummyBase64Pdf,
};

async function run() {
  const bodyString = JSON.stringify(payload);
  console.log(`[Test Realistic Payload] Payload Size: ${(bodyString.length / 1024).toFixed(2)} KB`);
  console.log(`Sending POST to ${ENDPOINT} with Origin: ${ORIGIN}...`);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ORIGIN,
        'Accept': 'application/json',
      },
      body: bodyString,
    });

    console.log(`\n--- RESPONSE DETAILS ---`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Headers:`);
    res.headers.forEach((val, key) => {
      console.log(`  ${key}: ${val}`);
    });

    const text = await res.text();
    console.log(`\nBody:\n${text}`);
  } catch (err) {
    console.error(`Fetch error:`, err);
  }
}

run();
