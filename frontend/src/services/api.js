const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchCameras(department = 'all') {
  const res = await fetch(`${API_BASE}/cameras?department=${department}`);
  return res.json();
}

export async function fetchGeoJson(department = 'all') {
  const res = await fetch(`${API_BASE}/cameras/geojson?department=${department}`);
  return res.json();
}

export async function fetchGapAnalysis() {
  const res = await fetch(`${API_BASE}/gap-analysis`);
  return res.json();
}

export async function fetchWatchlist() {
  const res = await fetch(`${API_BASE}/watchlist`);
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${API_BASE}/alerts`);
  return res.json();
}

export async function traceVehicle(plateNumber) {
  const res = await fetch(`${API_BASE}/trace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plate_number: plateNumber })
  });
  return res.json();
}

export async function fetchDetections() {
  const res = await fetch(`${API_BASE}/detections`);
  return res.json();
}

export async function onboardCamera(cameraData) {
  const res = await fetch(`${API_BASE}/cameras/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cameraData)
  });
  return res.json();
}

export async function syncSandbox(sandboxUrl) {
  const res = await fetch(`${API_BASE}/cameras/sync-sandbox`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sandbox_url: sandboxUrl })
  });
  return res.json();
}

export async function syncCatalogue() {
  const res = await fetch(`${API_BASE}/cameras/sync-catalogue`, { method: 'POST' });
  return res.json();
}

export async function bulkImportCameras(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/cameras/bulk-import`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

export async function fetchMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function startStream(cameraId) {
  const res = await fetch(`${API_BASE}/stream/start?camera_id=${cameraId}`, { method: 'POST' });
  return res.json();
}

export async function stopStream(cameraId) {
  const res = await fetch(`${API_BASE}/stream/stop?camera_id=${cameraId}`, { method: 'POST' });
  return res.json();
}

export async function streamStatus(cameraId) {
  const res = await fetch(`${API_BASE}/stream/status?camera_id=${cameraId}`);
  return res.json();
}

export async function scanPlates(cameraId, seg = 0) {
  const res = await fetch(`${API_BASE}/cams/${cameraId}/scan-plates?seg=${seg}`);
  if (!res.ok) throw new Error('scan failed');
  return res.json();
}

export async function fetchSandboxFeeds() {
  const res = await fetch(`${API_BASE}/sandbox/feeds`);
  return res.json();
}

export function getDetectionsCsvUrl() {
  return `${API_BASE}/reports/detections-csv`;
}

export function getJourneyCsvUrl(plateNumber) {
  return `${API_BASE}/reports/journey-csv?plate=${encodeURIComponent(plateNumber)}`;
}

export function getJourneyDossierUrl(plateNumber) {
  return `${API_BASE}/reports/journey-dossier?plate=${encodeURIComponent(plateNumber)}`;
}

export async function fetchClusterOverview() {
  const res = await fetch(`${API_BASE}/cluster/overview`);
  return res.json();
}


