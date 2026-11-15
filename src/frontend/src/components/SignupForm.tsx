import { useState, type FormEvent } from "react";
import { registerUser } from "../api/auth";
import { signupFormSchema } from "../api/schemas";
import { isPasswordValid } from "../utils/passwordRules";
import PasswordRequirements from "./PasswordRequirements";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend } from "./ui/field";
import { Input } from "./ui/input";

interface SignupFormProps {
  onSignedUp: (email: string, isRecruiter: boolean) => void;
  onSwitchToLogin: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function SignupForm({ onSignedUp, onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = signupFormSchema.safeParse({ email, password, confirmPassword, isRecruiter });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form values.");
      return;
    }
    if (!isPasswordValid(password)) {
      setError("Please meet all password requirements below.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerUser(email, password, isRecruiter);
      onSignedUp(email, isRecruiter);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FieldSet>
        <FieldLegend variant="label">Account Type</FieldLegend>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account Type">
          <Button
            type="button"
            variant={!isRecruiter ? "secondary" : "outline"}
            className="h-auto min-h-20 flex-col gap-1 p-3 text-center"
            role="radio"
            aria-checked={!isRecruiter}
            onClick={() => setIsRecruiter(false)}
          >
            <span className="text-sm font-semibold">Job Seeker</span>
            <span className="text-xs text-muted-foreground">Apply for jobs</span>
          </Button>
          <Button
            type="button"
            variant={isRecruiter ? "secondary" : "outline"}
            className="h-auto min-h-20 flex-col gap-1 p-3 text-center"
            role="radio"
            aria-checked={isRecruiter}
            onClick={() => setIsRecruiter(true)}
          >
            <span className="text-sm font-semibold">Recruiter</span>
            <span className="text-xs text-muted-foreground">Post & manage jobs</span>
          </Button>
        </div>
      </FieldSet>
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="signup-email">Email</FieldLabel>
          <Input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            placeholder="you@example.com"
          />
        </Field>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="signup-password">Password</FieldLabel>
          <Input
            id="signup-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            placeholder="••••••••"
          />
          <PasswordRequirements password={password} />
        </Field>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="signup-confirm-password">Confirm password</FieldLabel>
          <Input
            id="signup-confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            placeholder="••••••••"
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Creating account…" : "Sign up"}
      </Button>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <a
          href="/login"
          onClick={(event) => {
            event.preventDefault();
            onSwitchToLogin();
          }}
          className="font-medium text-primary hover:underline cursor-pointer"
        >
          Log in
        </a>
      </p>
    </form>
  );
}

export default SignupForm;
