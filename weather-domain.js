/* Weather data boundary.
   This file owns data parsing and network behaviour. The UI controller in
   index.html only decides what to render from the validated result. */
(() => {
'use strict';

const pad = n => String(n).padStart(2, '0');

function parseCoordinate(value){
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePlace(value){
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const lat = parseCoordinate(value.lat), lon = parseCoordinate(value.lon);
  if (lat == null || lon == null || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 60) : '';
  return { lat, lon, name: name || 'המקום הזה' };
}

function parseWeatherLocalTime(value){
  const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = +yearText, month = +monthText, day = +dayText, hour = +hourText, minute = +minuteText;
  const check = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 ||
      check.getUTCDate() !== day || check.getUTCHours() !== hour || check.getUTCMinutes() !== minute) return null;
  return { year, month, day, hour, isoDate: `${yearText}-${monthText}-${dayText}` };
}

function lastYear({ year, month, day }){
  const safeDay = (month === 2 && day === 29) ? 28 : day;
  return `${year - 1}-${pad(month)}-${pad(safeDay)}`;
}

function heDate({ year, month, day }){
  return new Intl.DateTimeFormat('he-IL', { timeZone: 'UTC', day: 'numeric', month: 'long' })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

const numberOrNull = value => (typeof value === 'number' && Number.isFinite(value)) ? value : null;
const TIMEOUT_MS = 12000;

async function getJSON(url, signal, ms = TIMEOUT_MS){
  const controller = new AbortController();
  const relayAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', relayAbort, { once: true });
  }
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return await response.json();
  } catch (error) {
    if (timedOut) throw new Error('הבקשה לקחה יותר מדי זמן');
    throw error;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', relayAbort);
  }
}

const api = { normalizePlace, parseWeatherLocalTime, lastYear, heDate, numberOrNull, getJSON };
if (typeof module !== 'undefined') module.exports = api;
globalThis.HamkachaWeather = api;
})();
