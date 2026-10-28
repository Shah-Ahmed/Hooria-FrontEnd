"use client";

// "My profile" page for normal users (role "user"): change own name, email, picture and password.
//   name / email / picture -> PATCH /api/profile (backend)
//   password               -> Firebase in the browser (it asks for the current password first)

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import Avatar from "@/components/Avatar";
import RequireRole from "@/components/RequireRole";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, errorMessage } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebase";
import { fileToAvatarDataUrl } from "@/lib/image";

// Turns a Firebase password error into a plain sentence.
function passwordError(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  if (["auth/wrong-password", "auth/invalid-credential", "auth/invalid-login-credentials"].includes(code)) {
    return "The current password is wrong";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Please wait a few minutes and try again";
  if (code === "auth/weak-password") return "The new password is too weak";
  if (code === "auth/requires-recent-login") return "Please log out, log in again and retry";
  return errorMessage(err);
}

// Checks the current password again before something sensitive is changed.
async function confirmCurrentPassword(currentPassword: string) {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new Error("You are not logged in");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
}

function ProfileContent() {
  const { profile, refreshProfile } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState(""); // current password, needed only to change the email
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined); // undefined = unchanged, "" = remove
  const [saving, setSaving] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // fill the form once the profile is loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setEmail(profile.email ?? "");
    }
  }, [profile]);

  if (!profile) return null;

  const shownPhoto = newPhoto !== undefined ? newPhoto || null : profile.photo;
  const emailChanged = email.trim().toLowerCase() !== (profile.email ?? "").toLowerCase();
  const nameChanged = name.trim() !== (profile.name ?? "");
  const hasChanges = emailChanged || nameChanged || newPhoto !== undefined;

  async function handlePhotoChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so choosing the same file again still works
    if (!file) return;
    setDetailsError(null);
    setDetailsSuccess(null);
    try {
      setNewPhoto(await fileToAvatarDataUrl(file));
    } catch (err) {
      setDetailsError(errorMessage(err));
    }
  }

  async function handleSaveDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDetailsError(null);
    setDetailsSuccess(null);
    setSaving(true);
    try {
      // changing the email needs the current password (re-checked by Firebase)
      if (emailChanged) {
        if (!emailPassword) throw new Error("Enter your current password to change the email");
        try {
          await confirmCurrentPassword(emailPassword);
        } catch (err) {
          throw new Error(passwordError(err));
        }
      }

      const body: { name?: string; email?: string; photo?: string } = {};
      if (nameChanged) body.name = name.trim();
      if (emailChanged) body.email = email.trim();
      if (newPhoto !== undefined) body.photo = newPhoto;
      await apiFetch("/api/profile", { method: "PATCH", body });

      // the login now has the new email: refresh the browser's copy and the session
      const user = getFirebaseAuth().currentUser;
      if (user) {
        await user.reload();
        await user.getIdToken(true);
      }
      await refreshProfile();
      setNewPhoto(undefined);
      setEmailPassword("");
      setDetailsSuccess("Your profile has been updated");
    } catch (err) {
      setDetailsError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (newPassword.length < 8) return setPwError("The new password must be at least 8 characters");
    if (newPassword !== confirmPassword) return setPwError("The new passwords do not match");
    if (newPassword === currentPassword) return setPwError("The new password must be different from the current one");

    setPwSaving(true);
    try {
      await confirmCurrentPassword(currentPassword);
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error("You are not logged in");
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwSuccess("Your password has been changed");
    } catch (err) {
      setPwError(passwordError(err));
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <>
      <h1 className="h4 mb-3">My profile</h1>

      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h6 mb-3">Details and picture</h2>
          {detailsError && <div className="alert alert-danger">{detailsError}</div>}
          {detailsSuccess && <div className="alert alert-success">{detailsSuccess}</div>}

          <form onSubmit={handleSaveDetails} className="row g-3">
            <div className="col-12 d-flex align-items-center gap-3">
              <Avatar photo={shownPhoto} name={name || profile.email} size={88} />
              <div>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp"
                  className="d-none" onChange={handlePhotoChosen} />
                <button type="button" className="btn btn-outline-primary btn-sm me-2"
                  onClick={() => fileInput.current?.click()} disabled={saving}>
                  {shownPhoto ? "Change picture" : "Upload picture"}
                </button>
                {shownPhoto && (
                  <button type="button" className="btn btn-outline-danger btn-sm"
                    onClick={() => setNewPhoto("")} disabled={saving}>
                    Remove picture
                  </button>
                )}
                <div className="meta-text mt-2">
                  JPEG, PNG or WebP. It is cropped to a square and made small automatically.
                  {newPhoto !== undefined && " Press Save changes to keep it."}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="profileName">Full name</label>
              <input id="profileName" className="form-control" value={name}
                onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="profileEmail">Email address</label>
              <input id="profileEmail" type="email" className="form-control" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {emailChanged && (
              <div className="col-md-6">
                <label className="form-label" htmlFor="emailPassword">Current password (needed to change the email)</label>
                <input id="emailPassword" type="password" className="form-control" value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)} autoComplete="current-password" required />
              </div>
            )}

            <div className="col-12">
              <button className="btn btn-primary" type="submit" disabled={saving || !hasChanges}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="h6 mb-3">Change password</h2>
          {pwError && <div className="alert alert-danger">{pwError}</div>}
          {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}

          <form onSubmit={handleChangePassword} className="row g-3">
            <div className="col-md-4">
              <label className="form-label" htmlFor="currentPassword">Current password</label>
              <input id="currentPassword" type="password" className="form-control" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="newPassword">New password (min 8 characters)</label>
              <input id="newPassword" type="password" className="form-control" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="confirmPassword">Repeat new password</label>
              <input id="confirmPassword" type="password" className="form-control" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit" disabled={pwSaving}>
                {pwSaving ? "Changing..." : "Change password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <RequireRole roles={["user"]}>
      <ProfileContent />
    </RequireRole>
  );
}
