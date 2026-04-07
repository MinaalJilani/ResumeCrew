import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiLogin, apiRegister } from "../lib/api";
import { login, logout } from "../lib/auth";


const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // If already logged in (valid token exists), redirect to dashboard
    const existingToken = localStorage.getItem("token");
    if (existingToken) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        await apiRegister(email, password, name);
        // Clear any stale session so the user MUST login fresh
        logout();
        setSuccess("✅ Account created! Check your inbox for a verification email, then sign in below.");
        setIsSignUp(false);
        setEmail("");
        setPassword("");
        return;
      } else {
        const data = await apiLogin(email, password);
        login(data.token, data.user_id, data.email);
        if (name) localStorage.setItem("full_name", name);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 animate-slide-up">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Sparkles className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">
            ResumeCrew<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Auth Card */}
        <Card className="w-full border-border bg-card shadow-2xl shadow-primary/5">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-xl text-foreground font-display">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isSignUp
                ? "Sign up to start your ResumeCrew journey"
                : "Sign in to your ResumeCrew assistant"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{success}</p>
              </div>
            )}


            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <div className="space-y-1.5 animate-slide-up">
                  <Label htmlFor="name" className="text-foreground">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" className="w-full flex gap-2 btn-hover" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary underline-offset-4 hover:underline font-medium"
                disabled={isLoading}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground opacity-60">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary underline">Terms</a> and{" "}
          <a href="#" className="text-primary underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Login;

