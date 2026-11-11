import { SetPasswordForm } from "./components/SetPasswordForm.jsx";

export default function AcceptInvitePage() {
  return (
    <SetPasswordForm
      title="Join your team on Salora Glam"
      endpoint="/auth/accept-invite"
      button="Set password and sign in"
      needsTerms
    />
  );
}
