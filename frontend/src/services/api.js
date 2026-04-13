import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

const client = axios.create({
  baseURL,
  timeout: 120_000,
  headers: { "Content-Type": "application/json" },
});

export async function fetchDashboard() {
  const { data } = await client.get("/api/dashboard");
  return data;
}

export async function fetchJobs(params) {
  const { data } = await client.get("/api/jobs", { params });
  return data;
}

export async function postUpdateJobs() {
  const { data } = await client.post("/api/jobs/update");
  return data;
}
