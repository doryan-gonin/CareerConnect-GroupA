
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/profileApi";

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  education: string;
  skills: string;
  linkedinUrl: string;
  githubUrl: string;
};

const initialProfile: ProfileData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  bio: "",
  education: "",
  skills: "",
  linkedinUrl: "",
  githubUrl: "",
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [savedProfile, setSavedProfile] =
    useState<ProfileData>(initialProfile);
  const [editing, setEditing] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
const token = sessionStorage.getItem("access_token");

useEffect(() => {
  if (!token) {
    setMessage("Please log in to load your profile.");
    return;
  }

  let cancelled = false;

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const data = await getProfile(token);

      if (cancelled) return;

      const updatedProfile: ProfileData = {
        ...initialProfile,
        firstName: data.first_name,
        lastName: data.last_name,
      };

      setProfile(updatedProfile);
      setSavedProfile(updatedProfile);
      setEditing(false);
      setMessage("");
    } catch (error) {
      if (!cancelled) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Error loading profile."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void fetchProfile();

  return () => {
    cancelled = true;
  };
}, [token]);


  const handleChange = (
    field: keyof ProfileData,
    value: string
  ) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
    setMessage("");
  };

 
const handleSave = async () => {
  if (!profile.firstName.trim() || !profile.lastName.trim()) {
    setMessage("Please enter your first and last name.");
    return;
  }

  if (!token) {
    setMessage("Please log in before saving your profile.");
    return;
  }

  setLoading(true);
  setMessage("");

  try {
    const result = await updateProfile(
      token,
      profile.firstName,
      profile.lastName
    );

    const updatedProfile: ProfileData = {
      ...profile,
      firstName: result.first_name,
      lastName: result.last_name,
    };

    setProfile(updatedProfile);
    setSavedProfile(updatedProfile);
    setEditing(false);

    setMessage(
      "First and last name saved successfully to the database. " +
      "Other profile fields are not saved to the database yet."
    );
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Error saving profile."
    );
  } finally {
    setLoading(false);
  }
};


  const handleCancel = () => {
    setProfile({ ...savedProfile });
    setEditing(false);
    setMessage("");
  };

  const renderField = (
    label: string,
    field: keyof ProfileData,
    placeholder: string
  ) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={field === "email" ? "email" : "text"}
        value={profile[field]}
        onChange={(event) => handleChange(field, event.target.value)}
        placeholder={placeholder}
        disabled={!editing}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 disabled:bg-gray-100"
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              My Profile
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your CareerConnect professional profile.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage("");
              }}
              className="rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
            >
              Edit Profile
            </button>
          )}
        </div>

        <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Personal Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            {renderField("First Name", "firstName", "Enter first name")}
            {renderField("Last Name", "lastName", "Enter last name")}
            {renderField("Email", "email", "Enter email address")}
            {renderField("Phone", "phone", "Enter phone number")}
            {renderField("Location", "location", "City, Province")}
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Professional Information
          </h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Professional Bio
              </label>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(event) =>
                  handleChange("bio", event.target.value)
                }
                placeholder="Tell recruiters about yourself..."
                disabled={!editing}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 disabled:bg-gray-100"
              />
            </div>

            {renderField(
              "Education",
              "education",
              "University, degree, graduation year"
            )}

            {renderField(
              "Skills",
              "skills",
              "Python, Java, React, SQL..."
            )}
          </div>
        </section>

        <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Professional Links
          </h2>

          <div className="space-y-5">
            {renderField(
              "LinkedIn",
              "linkedinUrl",
              "https://linkedin.com/in/..."
            )}
            {renderField(
              "GitHub",
              "githubUrl",
              "https://github.com/..."
            )}
          </div>
        </section>

        {message && (
          <p
            role="status"
            className="mb-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-800"
          >
            {message}
          </p>
        )}

        {editing && (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700"
            >
              Cancel
            </button>

            <button
  type="button"
  onClick={handleSave}
  disabled={loading}
  className="rounded-lg bg-blue-700 px-6 py-3 font-medium text-white hover:bg-blue-800 disabled:opacity-50"
>
  {loading ? "Saving..." : "Save Profile"}
</button>
          </div>
        )}
      </div>
    </main>
  );
}
