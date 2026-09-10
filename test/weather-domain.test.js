const assert = require('node:assert/strict');
const test = require('node:test');
const weather = require('../weather-domain.js');

test('normalizes valid places and rejects coercible non-numbers', () => {
  assert.deepEqual(weather.normalizePlace({ lat: '32.0853', lon: '34.7818', name: ' Tel Aviv ' }), {
    lat: 32.0853, lon: 34.7818, name: 'Tel Aviv'
  });
  for (const value of [null, false, true, '', '  ', [], {}]) {
    assert.equal(weather.normalizePlace({ lat: value, lon: 34, name: 'x' }), null);
  }
});

test('keeps the weather API local calendar time independent of the browser timezone', () => {
  const local = weather.parseWeatherLocalTime('2024-02-29T23:15');
  assert.deepEqual(local, { year: 2024, month: 2, day: 29, hour: 23, isoDate: '2024-02-29' });
  assert.equal(weather.lastYear(local), '2023-02-28');
  assert.equal(weather.parseWeatherLocalTime('2024-02-30T23:15'), null);
  assert.equal(weather.parseWeatherLocalTime('2024-02-29T24:00'), null);
});
