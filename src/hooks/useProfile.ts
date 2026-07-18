import { useCallback, useEffect, useState } from "react";
import { ProfileAPI, ProfileAPIError, type ProfileData, type UpdateProfileInput } from "../api/ProfileAPI";

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ProfileAPIError | null>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await ProfileAPI.getProfile(signal));
    } catch (value) {
      if (value instanceof DOMException && value.name === "AbortError") return;
      setError(value instanceof ProfileAPIError ? value : new ProfileAPIError({ message: value instanceof Error ? value.message : "Unable to load profile" }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const save = useCallback(async (input: UpdateProfileInput) => {
    setSaving(true);
    setError(null);
    try {
      const result = await ProfileAPI.updateProfile(input);
      setProfile(result);
      window.dispatchEvent(new CustomEvent("quizara:profile-updated", { detail: result }));
      return result;
    } catch (value) {
      const normalized = value instanceof ProfileAPIError ? value : new ProfileAPIError({ message: value instanceof Error ? value.message : "Unable to update profile" });
      setError(normalized);
      throw normalized;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, loading, saving, error, refresh, save };
}
