import { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../api/profiles";
import { profileFormSchema } from "../api/schemas";
import type { Profile } from "../api/types";
import type { ChangeEvent, FormEvent } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

function ProfileSection({ token }: { token: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setError("");
        const data = await getProfile(token);
        if (isMounted) {
          setProfile(data);
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (token) {
      loadProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const parsed = profileFormSchema.safeParse({ firstName, lastName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please enter your name.");
      return;
    }
    setIsSaving(true);

    try {
      const updated = await updateProfile(token, { firstName, lastName });
      setProfile(updated);
      setIsEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setFirstName(profile?.first_name || "");
    setLastName(profile?.last_name || "");
    setIsEditing(false);
    setError("");
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
        {!isEditing && !isLoading && (
          <Button
            type="button"
            variant="link"
            onClick={() => {
              setSuccess("");
              setError("");
              setIsEditing(true);
            }}
          >
            Edit
          </Button>
        )}
      </div>

      {success && (
        <Alert className="mt-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mt-4" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3 py-8">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSave} className="mt-4">
          <FieldGroup>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="profile-first-name">First Name</FieldLabel>
              <Input
                id="profile-first-name"
                type="text"
                value={firstName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                placeholder="e.g. Jane"
                aria-invalid={Boolean(error)}
              />
            </Field>

            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="profile-last-name">Last Name</FieldLabel>
              <Input
                id="profile-last-name"
                type="text"
                value={lastName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                placeholder="e.g. Doe"
                aria-invalid={Boolean(error)}
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </FieldGroup>
        </form>
      ) : (
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <dt className="text-gray-500">First Name</dt>
            <dd className="font-medium text-gray-900">
              {profile?.first_name || <span className="italic text-gray-400">Not provided</span>}
            </dd>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between">
            <dt className="text-gray-500">Last Name</dt>
            <dd className="font-medium text-gray-900">
              {profile?.last_name || <span className="italic text-gray-400">Not provided</span>}
            </dd>
          </div>

          {profile?.last_updated && (
            <div className="flex flex-col sm:flex-row sm:justify-between border-t border-gray-100 pt-3">
              <dt className="text-gray-500">Last Updated</dt>
              <dd className="text-gray-600">{new Date(profile.last_updated).toLocaleString()}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

export default ProfileSection;
