import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeClosed } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address").max(255);
const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);

const getReadableError = (error: string): string => {
  if (error.includes("Invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (error.includes("User already registered")) {
    return "This email is already registered. Try logging in instead.";
  }
  if (error.includes("Email not confirmed")) {
    return "Please verify your email before logging in. Check your inbox for the verification link.";
  }
  if (error.includes("Invalid email")) {
    return "Please enter a valid email address.";
  }
  if (error.includes("Password should be at least 6 characters")) {
    return "Password must be at least 6 characters long.";
  }
  if (error.includes("Unable to validate email address")) {
    return "This email address is not valid.";
  }
  if (error.includes("Email rate limit exceeded")) {
    return "Too many requests. Please wait a few minutes and try again.";
  }
  if (error.includes("Signups not allowed")) {
    return "Sign ups are currently disabled. Please contact support.";
  }
  return error;
};

// Password strength calculator
const getPasswordStrength = (
  password: string,
): { score: number; label: string; color: string } => {
  if (password.length === 0) return { score: 0, label: "", color: "" };

  let score = 0;

  // Length check
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;

  // Complexity checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; // Mixed case
  if (/\d/.test(password)) score++; // Has number
  if (/[^a-zA-Z0-9]/.test(password)) score++; // Has special char

  if (score <= 2) return { score: 33, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score: 66, label: "Medium", color: "bg-yellow-500" };
  return { score: 100, label: "Strong", color: "bg-green-500" };
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const passwordStrength = getPasswordStrength(password);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!isLogin) {
        nameSchema.parse(fullName);
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login Failed",
            description: getReadableError(error.message),
            variant: "destructive",
          });
        } else {
          // Handle remember me
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
          }
          navigate("/businesses");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: "Sign Up Failed",
            description: getReadableError(error.message),
            variant: "destructive",
          });
        } else {
          toast({
            title: "✉️ Check your email",
            description:
              "We sent you a verification link. Please verify your email to continue.",
            duration: 6000,
          });
          // Auto switch to login view
          setIsLogin(true);
          setPassword("");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-responsive">
      <Card className="w-full max-w-md card-responsive">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-center">
            {isLogin ? t("auth.login") : t("auth.signup")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={100}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={100}
              />
            </div> */}
            <div className="space-y-2 relative">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={100}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeClosed className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* Password strength indicator for signup */}
            {!isLogin && password && (
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground flex justify-between">
                  <span>{passwordStrength.label} password</span>
                  <span>{password.length}/100</span>
                </p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="default"
            >
              {isLogin ? t("auth.login") : t("auth.signup")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
              size="default"
            >
              {isLogin
                ? t("auth.dontHaveAccount")
                : t("auth.alreadyHaveAccount")}
            </Button>

            {/* Remember me checkbox for login */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Remember me
                  </label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm h-auto"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
