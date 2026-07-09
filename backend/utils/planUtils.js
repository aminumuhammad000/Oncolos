function normalizePlanPayload(payload = {}) {
  return {
    price: Number(payload.price),
    daily: Number(payload.daily),
    duration: Number(payload.duration || 60),
    isActive: payload.isActive === true || payload.isActive === 'true' || payload.isActive === 1
  };
}

function buildDefaultPlans() {
  return [
    { price: 6000, daily: 1000, duration: 60, isActive: true },
    { price: 12000, daily: 2000, duration: 60, isActive: true },
    { price: 24000, daily: 4000, duration: 60, isActive: true },
    { price: 45000, daily: 8000, duration: 60, isActive: true },
    { price: 90000, daily: 15000, duration: 60, isActive: true },
    { price: 150000, daily: 25000, duration: 60, isActive: true },
    { price: 246000, daily: 41000, duration: 60, isActive: true },
    { price: 300000, daily: 50000, duration: 60, isActive: true }
  ];
}

module.exports = { normalizePlanPayload, buildDefaultPlans };
