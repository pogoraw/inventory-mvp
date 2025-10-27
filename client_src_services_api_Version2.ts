import axios from "axios";
const API_BASE = "http://10.0.2.2:4000"; // emulator default; use http://localhost:4000 on web or adjust

let token: string | null = null;
export function setToken(t: string) { token = t; }
function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(username: string) {
  const r = await axios.post(API_BASE + "/auth/login", { username });
  token = r.data.token;
  return r.data;
}

export async function getProducts() {
  const r = await axios.get(API_BASE + "/products", { headers: authHeaders() });
  return r.data;
}

export async function createShipment(payload: any) {
  const r = await axios.post(API_BASE + "/shipments", payload, { headers: authHeaders() });
  return r.data;
}

export async function updateShipmentStatus(id: string, status: string, sendNow = false) {
  const r = await axios.put(API_BASE + `/shipments/${id}/status`, { status, sendNow }, { headers: authHeaders() });
  return r.data;
}

export async function sync(clientId: string, changes: any[]) {
  const r = await axios.post(API_BASE + "/sync", { clientId, changes }, { headers: authHeaders() });
  return r.data;
}