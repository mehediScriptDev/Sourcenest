const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('https://api-jaawass.maktechlaravel.cloud/api/v1/login', {
      email: 'pending-manufacturer@dev.com',
      password: 'password', // or whatever password
      role: 'manufacturer'
    }, {
      validateStatus: () => true
    });
    
    console.log("Status:", res.status);
    console.log("Response data:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testLogin();
