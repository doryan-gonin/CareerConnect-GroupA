
const API_URL = "http://127.0.0.1:8000";

export type BackendProfile = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
};

export async function getProfile(
  token: string
): Promise<BackendProfile> {
  const response = await fetch(`${API_URL}/api/profiles/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load profile (${response.status})`);
  }

  return response.json();
}

export async function updateProfile(
  token: string,
  firstName: string,
  lastName: string
): Promise<BackendProfile> {
  const response = await fetch(`${API_URL}/api/profiles/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save profile (${response.status})`);
  }

  return response.json();
}
