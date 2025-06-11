// Test script for payment upload functionality
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000'; // Change to your API server URL
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NWYzZDFjNWUwMWI4YjlhMGUxYzdhOSIsInJvbGUiOiJQSEFSTUFDWV9PV05FUiIsImlhdCI6MTcxODEwMTI3NCwiZXhwIjoxNzUwNjU4ODc0fQ.vJbBDR5XgQ6InGGXlV8qV0jM0zMQCsW1TUuKfL6uGRQ'; // Replace with a valid token from localStorage

// Create test file
const createTestFile = () => {
  const testFilePath = path.join(__dirname, 'test-receipt.png');
  const fileSize = 30 * 1024; // 30KB - smaller size for more reliable testing

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

// Test payment submission
const testPaymentSubmission = async () => {
  try {
    const testFilePath = createTestFile();

    // Create form data
    const formData = new FormData();
    formData.append('dueId', '645f3d1c5e01b8b9a0e1c7a8'); // Replace with a valid due ID
    formData.append('pharmacyId', '645f3d1c5e01b8b9a0e1c7a9'); // Replace with a valid pharmacy ID
    formData.append('amount', '100.00');
    formData.append('paymentMethod', 'bank_transfer');
    formData.append('paymentReference', 'TEST-REF-123');
    formData.append('timestamp', Date.now().toString());

    // Add the file
    formData.append('receipt', fs.createReadStream(testFilePath));

    console.log('Submitting test payment...');
    console.log(`Using endpoint: ${API_URL}/api/payments/submit`);

    // Set request headers
    const headers = {
      ...formData.getHeaders(),
    };

    // Add authentication if available
    if (TOKEN) {
      headers['Authorization'] = `Bearer ${TOKEN}`;
    }

    console.log('Request headers:', headers);

    // Make the request
    const response = await axios.post(
      `${API_URL}/api/payments/submit`, // Use the correct path with /api prefix
      formData,
      {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000, // 60 seconds
        decompress: true, // Handle any compression
        validateStatus: null, // Don't throw on any status code
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
    console.error('Test failed:', error.message);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);

      return {
        success: false,
        status: error.response.status,
        data: error.response.data,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

// Run the test
testPaymentSubmission()
  .then((result) => {
    console.log('Test completed.');
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
