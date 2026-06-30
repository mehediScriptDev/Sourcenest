const axios = require('axios');

async function testEnroll() {
  try {
    // 1. Login to get the token
    const loginRes = await axios.post('https://api-jaawass.maktechlaravel.cloud/api/v1/login', {
      email: 'pending-manufacturer@dev.com',
      password: 'password',
      role: 'manufacturer'
    });
    
    const token = loginRes.data.data.access_token;
    const userId = loginRes.data.data.user.id;
    console.log("Logged in successfully. User ID:", userId);
    
    // 2. Fetch active promotion to get the ID
    const promoRes = await axios.get('https://api-jaawass.maktechlaravel.cloud/api/v1/promotions/active');
    console.log("Active Promotion Response Status:", promoRes.status);
    
    if (!promoRes.data || !promoRes.data.data) {
      console.log("No active promotion found.", promoRes.data);
      return;
    }
    
    const promotionId = promoRes.data.data.id;
    console.log("Active Promotion ID:", promotionId);

    // 3. Attempt to enroll using /admin/promotions/{id}/enroll
    console.log(`Enrolling User ${userId} in Promotion ${promotionId}...`);
    const enrollRes = await axios.post(
      `https://api-jaawass.maktechlaravel.cloud/api/v1/admin/promotions/${promotionId}/enroll`,
      { user_id: userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        validateStatus: () => true
      }
    );
    
    console.log("Enroll Response Status:", enrollRes.status);
    console.log("Enroll Response Data:", JSON.stringify(enrollRes.data, null, 2));
    
  } catch (err) {
    console.error("Error occurred:", err.message);
    if (err.response) {
      console.error("Error response:", err.response.status, err.response.data);
    }
  }
}

testEnroll();
