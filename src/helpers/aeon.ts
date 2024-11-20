// src/helpers/aeon.ts
export const createPayment = async () => {
  try {
    const apiKey = import.meta.env.VITE_AEON_API_KEY;
    
    const response = await fetch('https://api.aeon.games/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 9.99,
        currency: 'USD',
        description: 'TON Good Games Premium Membership',
        redirect_url: window.location.origin + '/payment-success'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('AEON payment creation failed:', error);
    throw error;
  }
};