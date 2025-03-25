import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, checkServerHealth } from '../config/api';
import { useToast } from '../components/ui/use-toast';
import { login } from '../services/authService';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(true);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkServer = async () => {
      const isHealthy = await checkServerHealth();
      setServerStatus(isHealthy);
      if (!isHealthy) {
        toast({
          variant: "destructive",
          title: "Server Error",
          description: "Unable to connect to server. Please try again later.",
        });
      }
    };
    checkServer();
  }, [toast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serverStatus) {
      toast({ variant: "destructive", title: "Server Error", description: "Server is unavailable." });
      return;
    }

    setIsLoading(true);
    setShowVerificationMessage(false);

    try {
      await login(formData.email, formData.password);
      toast({ title: "Success!", description: "Signed in successfully" });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const message = error?.message || "Failed to sign in";

      if (message.includes('verification')) {
        setShowVerificationMessage(true);
      }

      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Sign in to your account</h2>
          <p className="text-sm text-muted-foreground">Access your dashboard</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input id="rememberMe" name="rememberMe" type="checkbox" className="h-4 w-4" checked={formData.rememberMe} onChange={handleChange} />
              <span className="ml-2 text-sm">Remember me</span>
            </label>

            <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80">
              Forgot password?
            </Link>
          </div>

          {showVerificationMessage && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
              Please check your email for the verification link. <Link to="/resend-verification" className="underline">Resend</Link>.
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign in"}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => window.location.href = `${API_ENDPOINTS.LOGIN}/google`} disabled={isLoading}>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="#4285F4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              </svg>
              Google
            </Button>

            <Button type="button" variant="outline" onClick={() => window.location.href = `${API_ENDPOINTS.LOGIN}/facebook`} disabled={isLoading}>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
