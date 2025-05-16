import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if Supabase is properly configured
    setSupabaseConfigured(isSupabaseConfigured());
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabaseConfigured) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        
        navigate("/");
      } else {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Please check your email for verification.",
        });
        
        // Optionally switch to login mode after signup
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabaseConfigured) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    setIsGoogleLoading(true);

    try {
      // Get the current app URL for the redirect
      // We need to ensure we come back to exactly this URL after auth
      const currentUrl = window.location.href.split('#')[0]; // Remove any hash fragments
      console.log("Current exact URL for OAuth redirect:", currentUrl);
      
      // This ensures we redirect back to the exact same URL/port
      // So if we're on localhost:3000, we come back to localhost:3000
      // If we're on 192.168.18.150:8080, we come back to that
      
      console.log("Starting Google OAuth sign-in process with redirect to:", currentUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: currentUrl,
          scopes: 'email profile',
          queryParams: {
            prompt: 'select_account'
          }
        },
      });
      
      if (error) {
        console.error("Google OAuth error:", error);
        throw error;
      }
      
      console.log("OAuth setup successful, redirecting to:", data?.url);
      
      // If we have a URL to redirect to, navigate there
      if (data?.url) {
        console.log("Redirecting to Google authorization URL");
        // Use window.location for a full page reload to Google's auth page
        window.location.href = data.url;
      } else {
        console.error("No redirect URL returned from Supabase OAuth setup");
        toast({
          title: "Authentication Error",
          description: "Failed to start Google sign-in process. Please try again.",
          variant: "destructive",
        });
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Google Sign-In Error",
        description: error.message || "An error occurred while signing in with Google",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Reset form when toggling
    setEmail("");
    setPassword("");
  };

  // Render different layouts based on screen size
  return (
    <div className="min-h-screen">
      {/* Mobile View - Centered clean design */}
      <div className="md:hidden flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full sm:max-w-md px-4">
          <Card className="border border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-6">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <img
                  src="/full-logo.svg"
                  alt="Vocalink Logo"
                  className="w-25 h-25 object-contain"
                />
              </div>
              
              {/* Tagline */}
              <p className="text-center text-sm text-muted-foreground mb-8">
                Type less, do more!
              </p>

              {/* Headings */}
              <div className="space-y-1 mb-6 text-center">
                <h1 className="text-2xl font-semibold">
                  {isLogin ? "Log in to your account" : "Create an account"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isLogin 
                    ? "" 
                    : ""}
                </p>
              </div>

              {/* Supabase Configuration Warning */}
              {!supabaseConfigured && (
                <Alert className="mb-6" variant="destructive">
                  <AlertTitle>Configuration Error</AlertTitle>
                  <AlertDescription>
                    Supabase is not properly configured. Please add your Supabase URL and anonymous key to the .env file.
                  </AlertDescription>
                </Alert>
              )}

              {/* Auth Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="mobile-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete={isLogin ? "username" : "email"}
                    className="w-full rounded-md p-3 transition-all duration-300"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-password" className="text-sm font-medium">
                    Password
                  </Label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline transition-colors"
                      onClick={() => {
                        toast({
                          title: "Coming soon",
                          description: "Password reset functionality will be available soon",
                        });
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="mobile-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="w-full rounded-md p-3 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-3 hover:bg-primary/90 transition-colors" 
                  disabled={isLoading || !supabaseConfigured}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    isLogin ? "Sign In with Email" : "Sign Up with Email"
                  )}
                </Button>
              </form>

              {/* OR Separator */}
              {/* Temporarily disabled Google Sign-In
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                  <span className="bg-white px-2">OR CONTINUE WITH</span>
                </div>
              </div>
              
              Google Sign In Button
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-3 transition-colors hover:bg-gray-100"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || !supabaseConfigured}
                >
                  {isGoogleLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                        </g>
                      </svg>
                      Sign in with Google
                    </div>
                  )}
                </Button>
              </div>
              */}

              {/* Toggle Auth Mode */}
              <div className="text-xs text-center text-muted-foreground mt-4">
                {isLogin ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={toggleAuthMode}
                      className="text-primary hover:underline transition-colors"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={toggleAuthMode}
                      className="text-primary hover:underline transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>

              {/* Terms and Privacy */}
              <div className="mt-6 text-center text-xs text-muted-foreground">
                By using Vocalink, you agree to our{" "}
                <a href="#" className="text-primary hover:underline transition-colors">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline transition-colors">
                  Privacy Policy
                </a>
                .
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop View - Original split-screen layout */}
      <div className="hidden md:flex flex-col md:flex-row min-h-screen">
        {/* Left side - Background/Logo */}
        <div className="w-full md:w-1/2 bg-primary/10 flex flex-col items-center justify-center p-8">
          <div className="max-w-md">
            {/* Replace with your own logo or illustration */}
            <div className="mb-8 text-center">
              <img
                src="/full-logo.svg"
                alt="Vocalink Logo"
                className="mx-auto w-50 h-50 object-contain"
              />
              <p className="text-muted-foreground mt-4">Type less, do more!</p>
            </div>
        
            {/* Tagline */}
            <h2 className="text-xl font-semibold text-center mb-4 mt-20">See how it works:</h2>
            
            {/* YouTube Video Embed */}
            <div className="aspect-video w-full md:w-[120%] md:-ml-[10%] rounded-lg overflow-hidden shadow-lg">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/2Ic2JqRH78g?si=NMggqMkvMPIvEd3O&controls=1&showinfo=0&rel=0&modestbranding=1" 
                title="Vocalink Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="aspect-video"
              ></iframe>
            </div>
            
            {/* Optional short description below video */}
            <p className="text-center text-sm mt-4 text-muted-foreground">
              Write clear, well-formatted text using <b>only</b> your voice.
            </p>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {!supabaseConfigured && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                  Supabase is not properly configured. Please add your Supabase URL and anonymous key to the .env file.
                </AlertDescription>
              </Alert>
            )}
            
            <Card className="border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                   {isLogin ? "Log in to your account" : "Create an account"}
                </CardTitle>
                <CardDescription>
                  {isLogin
                    ? ""
                    : ""}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleAuth}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="desktop-email">Email</Label>
                    <Input
                      id="desktop-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete={isLogin ? "username" : "email"}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="desktop-password">Password</Label>
                    {isLogin && (
                      <a
                        href="#"
                        className="text-sm text-primary hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            title: "Coming soon",
                            description: "Password reset functionality will be available soon",
                          });
                        }}
                      >
                        Forgot password?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="desktop-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !supabaseConfigured}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      isLogin ? "Sign In with Email" : "Sign Up with Email"
                    )}
                  </Button>
                  
                  {/* OR Separator */}
                  {/* Temporarily disabled Google Sign-In
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-xs text-muted-foreground">
                      <span className="bg-white px-2">OR CONTINUE WITH</span>
                    </div>
                  </div>
                  
                  Google Sign In Button
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full transition-colors hover:bg-gray-100"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || !supabaseConfigured}
                  >
                    {isGoogleLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                          </g>
                        </svg>
                        Sign in with Google
                      </div>
                    )}
                  </Button>
                  */}
                  
                  <div className="text-center text-sm">
                    {isLogin ? (
                      <p>
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={toggleAuthMode}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign Up
                        </button>
                      </p>
                    ) : (
                      <p>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={toggleAuthMode}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign In
                        </button>
                      </p>
                    )}
                  </div>
                </CardFooter>
              </form>
            </Card>

            <div className="mt-6 text-center text-xs text-muted-foreground">
              By using Vocalink, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
