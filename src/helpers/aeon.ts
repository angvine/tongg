// src/helpers/aeon.ts
export const createPayment = async () => {
  // Simulate payment success
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};