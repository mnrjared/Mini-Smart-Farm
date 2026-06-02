import { useEffect, useState } from 'react';
import { useNavigate, Link } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Wheat, Lock, User } from "lucide-react";






export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  


  if (!username || !password) {
    setError("Please enter both username and password");
    return;
  }
  

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      
    });
    const data = await response.json();

    if (response.ok && data.success) {
      sessionStorage.setItem("userId", data.user);  //---should store the User ID until the user closes the browser tab
      navigate("/dashboard");
    } else {
      setError(data.message || "Invalid credentials");
    }
  } catch (err) {
    setError("Server error. Please try again.");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-green-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <Wheat className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bela-Bela Smart Farm</h1>
          <p className="text-blue-100">Belgium Campus × Penn State University</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to access the smart farm dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Sign In
              </Button>

              <div className="text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
                  Register here
                </Link>
              </div>

              <div className="text-center text-sm text-slate-600">
                Demo: Use any username and password to login
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-blue-100">
          <p>Empowering communities through IoT and sustainable agriculture</p>
          <p className="mt-2 text-xs text-blue-200">Data transmitted via LoRa Network Technology</p>
        </div>
      </div>
    </div>
  );
}