import { useState, type FormEvent } from "react";
import { loginUser } from "../api/auth";
import { loginFormSchema } from "../api/schemas";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";

interface LoginFormProps {
  successMessage?: string;
  onLoggedIn: (accessToken: string, isRecruiter?: boolean) => void;
  onSwitchToSignup: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function LoginForm({ successMessage = "", onLoggedIn, onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter your email and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await loginUser(email, password);
      onLoggedIn(data.access_token, data.is_recruiter);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-gray-900">Log in</h1>
      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            placeholder="you@example.com"
          />
        </Field>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="login-password">Password</FieldLabel>
          <Input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            placeholder="••••••••"
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-center text-sm text-gray-600">
        Need an account?{" "}
        <a
          href="/signup"
          onClick={(event) => {
            event.preventDefault();
            onSwitchToSignup();
          }}
          className="font-medium text-primary hover:underline cursor-pointer"
        >
          Sign up
        </a>
      </p>
    </form>
  );
}

export default LoginForm;
