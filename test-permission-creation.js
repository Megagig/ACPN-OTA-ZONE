const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPermissionCreation() {
  try {
    console.log('🔐 Testing permission creation...');

    // First, login as superadmin
    console.log('📝 Logging in as superadmin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'Megagigdev@gmail.com',
      password: 'Exploit4ever@247',
    });

    console.log('✅ Login successful');
    const token = loginResponse.data.token;

    // Test permission creation
    console.log('🛠️ Creating test permission...');
    const permissionData = {
      name: 'test_permission',
      resource: 'test_resource',
      action: 'create',
      description: 'Test permission for debugging',
    };

    const createResponse = await axios.post(
      `${BASE_URL}/permissions`,
      permissionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Permission created successfully:');
    console.log(JSON.stringify(createResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.stack) {
      console.error('Stack trace:', error.response.data.stack);
    }
  }
}

testPermissionCreation();
