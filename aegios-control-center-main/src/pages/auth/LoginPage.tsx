import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      toast.success('Login successful!');
      navigate('/fetching-service/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-cyber-border bg-card glow-border">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary glow-text" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary glow-text">
            Aegios
          </CardTitle>
          <p className="text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                GitHub Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your GitHub username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-secondary border-cyber-border text-foreground"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-cyber-border text-foreground"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end">
              <Link
                to="/authentication/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-background"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link
                to="/authentication/signup"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
