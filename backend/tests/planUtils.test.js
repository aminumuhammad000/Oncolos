const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePlanPayload, buildDefaultPlans } = require('../utils/planUtils');

test('normalizePlanPayload converts form values into the shape the server expects', () => {
  const normalized = normalizePlanPayload({
    price: '6000',
    daily: '1000',
    duration: '60',
    isActive: 'true'
  });

  assert.deepEqual(normalized, {
    price: 6000,
    daily: 1000,
    duration: 60,
    isActive: true
  });
});

test('buildDefaultPlans returns the expected default package list', () => {
  const plans = buildDefaultPlans();

  assert.equal(plans.length, 8);
  assert.deepEqual(plans[0], { price: 6000, daily: 1000, duration: 60, isActive: true });
  assert.deepEqual(plans[plans.length - 1], { price: 300000, daily: 50000, duration: 60, isActive: true });
});
