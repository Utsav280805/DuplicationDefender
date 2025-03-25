import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, checkServerHealth } from '../config/api';
import { useToast } from '../components/ui/use-toast';
import { signup } from '../services/authService';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Loader2 } from 'lucide-react';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(true);
  const [showExistingAccountMessage, setShowExistingAccountMessage] = useState(false);
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
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!serverStatus) {
      toast({
        variant: "destructive",
        title: "Server Error",
        description: "Unable to connect to server. Please try again later.",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      return;
    }

    setIsLoading(true);
    setShowExistingAccountMessage(false);
    
    try {
      await signup(formData.name, formData.email, formData.password);
      
      toast({
        title: "Success!",
        description: "Account created successfully. Please check your email to verify your account.",
      });

      navigate('/signin');
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.message === 'Email already exists') {
        setShowExistingAccountMessage(true);
        toast({
          variant: "destructive",
          title: "Account Already Exists",
          description: "An account with this email already exists. Please sign in instead.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to create account",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-lg shadow-lg">
        <h2 className="text-center text-3xl font-bold">Create your account</h2>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-primary hover:text-primary/80">Sign in</Link>
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          {showExistingAccountMessage && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-sm text-yellow-700">
                An account with this email already exists. Please{' '}
                <Link to="/signin" className="font-medium underline text-yellow-700 hover:text-yellow-600">sign in</Link>{' '}or use a different email.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : 'Sign up'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;