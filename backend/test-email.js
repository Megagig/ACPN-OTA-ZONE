const axios = require('axios');

// Test registration endpoint
const testRegistration = async () => {
  try {
    console.log('Testing registration endpoint...');
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      phone: '08012345678',
      password: 'TestPassword123!',
      pcnLicense: 'PCN12345'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Registration successful:', response.data);
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
  }
};

testRegistration();
