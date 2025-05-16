import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

const queryClient = new QueryClient();

const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthResponse = async () => {
      if (location.hash && location.hash.includes("access_token")) {
        console.log("Processing auth callback with hash:", location.hash);
        try {
          const hashParams = new URLSearchParams(
            location.hash.substring(1)
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const expiresIn = hashParams.get("expires_in");
          console.log("Found tokens in URL, access token present:", !!accessToken);
          console.log("Refresh token present:", !!refreshToken);
          if (accessToken && refreshToken) {
            console.log("Manually setting session with extracted tokens");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (error) {
              console.error("Error setting session:", error);
              toast({
                title: "Authentication Error",
                description: error.message || "Failed to complete authentication",
                variant: "destructive",
              });
              return;
            }
            if (data?.session) {
              console.log("Session successfully established!");
              window.history.replaceState(null, "", window.location.pathname);
              toast({
                title: "Authentication Successful",
                description: "You have successfully signed in!",
              });
              navigate("/");
            } else {
              console.error("No session data returned after setting tokens");
              toast({
                title: "Authentication Error",
                description: "Failed to establish a session. Please try again.",
                variant: "destructive",
              });
            }
          } else {
            console.error("Missing required tokens in URL hash");
          }
        } catch (err) {
          console.error("Failed to process auth callback:", err);
          toast({
            title: "Authentication Error",
            description: "Failed to complete the sign-in process. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    handleAuthResponse();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      } else if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate, location.hash, toast]);
  
  return null;
};

const AppRouter = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const processAuthTokens = async () => {
      try {
        if (location.hash && location.hash.includes("access_token")) {
          console.log("Auth tokens found in URL, processing...");
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        const { data } = await supabase.auth.getUser();
        setIsAuthenticated(!!data.user);
      } catch (error) {
        console.error("Error in auth process:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    processAuthTokens();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [location.hash]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <>
      <AuthHandler />
      <Routes>
        <Route 
          path="/auth" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="*" 
          element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;