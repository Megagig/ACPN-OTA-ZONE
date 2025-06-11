const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Create a simple test receipt file
const createTestFile = () => {
  const testFilePath = path.join(__dirname, 'test-receipt.png');
  const fileSize = 10 * 1024; // 10KB - very small for testing

  // Create a small PNG file
  const header = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  // Pad the file to desired size
  const padding = Buffer.alloc(fileSize - header.length);

  // Write the file
  fs.writeFileSync(testFilePath, Buffer.concat([header, padding]));
  console.log(`Created test file: ${testFilePath} (${fileSize} bytes)`);

  return testFilePath;
};

// Test direct submission with Axios (no XMLHttpRequest)
const testDirectUpload = async () => {
  try {
    // Create test file
    const testFilePath = createTestFile();

    // Create form data
    const formData = new FormData();
    formData.append('dueId', '645f3d1c5e01b8b9a0e1c7a8');
    formData.append('pharmacyId', '645f3d1c5e01b8b9a0e1c7a9');
    formData.append('amount', '100.00');
    formData.append('paymentMethod', 'bank_transfer');
    formData.append('paymentReference', 'TEST-REF-123');
    formData.append('timestamp', Date.now().toString());

    // Add the file
    formData.append('receipt', fs.createReadStream(testFilePath));

    console.log('Submitting test payment...');

    // Log headers for debugging
    const formHeaders = formData.getHeaders();
    console.log('Form headers:', formHeaders);

    // Create auth token (replace with actual token)
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NWYzZDFjNWUwMWI4YjlhMGUxYzdhOSIsInJvbGUiOiJQSEFSTUFDWV9PV05FUiIsImlhdCI6MTcxODEwMTI3NCwiZXhwIjoxNzUwNjU4ODc0fQ.vJbBDR5XgQ6InGGXlV8qV0jM0zMQCsW1TUuKfL6uGRQ';

    // Make the direct API request
    console.log('Sending request to http://localhost:5000/api/payments/submit');
    const response = await axios.post(
      'http://localhost:5000/api/payments/submit',
      formData,
      {
        headers: {
          ...formHeaders,
          Authorization: `Bearer ${token}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000, // 60 seconds
      }
    );

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('Test file removed');

    return {
      success: true,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error('Upload test failed:', error.message);
    console.error('Error details:', error);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }

    // Try to clean up test file
    try {
      const testFilePath = path.join(__dirname, 'test-receipt.png');
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
        console.log('Test file removed');
      }
    } catch (e) {
      console.error('Error removing test file:', e.message);
    }

    return {
      success: false,
      error: error.message,
      response: error.response
        ? {
            status: error.response.status,
            data: error.response.data,
          }
        : null,
    };
  }
};

// Run the test
testDirectUpload()
  .then((result) => {
    console.log(
      'Test completed with result:',
      result.success ? 'SUCCESS' : 'FAILURE'
    );
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
