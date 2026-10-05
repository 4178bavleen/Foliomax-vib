import { useState, FormEvent, ChangeEvent, KeyboardEvent } from "react";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const { login } = useAuth() as { login: (email: string, password: string) => Promise<void> };

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (submitting) return;           // ← guard against duplicate submits
  setError("");
  setSubmitting(true);
  try {
    await login(email.trim(), password);
    // navigate happens inside login()
  } catch (err: unknown) {
    let msg = "Login failed. Please try again.";
    if (err instanceof Error) msg = err.message;
    else if (typeof err === "object" && err && "response" in err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      msg = axiosErr.response?.data?.message ?? msg;
    }
    setError(msg);
  } finally {
    setSubmitting(false);
  }
};


  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleTogglePassword = () => {
    setShowPassword((v) => !v);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowPassword((v) => !v);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          <div>
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={handleEmailChange}
                  required
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <span
                    onClick={handleTogglePassword}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    role="button"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              )}

              <div>
                <Button
                  className="w-full"
                  size="sm"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
