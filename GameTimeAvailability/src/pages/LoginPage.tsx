// src/pages/LoginPage.tsx
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex flex-col gap-10 items-center justify-center min-h-screen">
      <div><h1 className="login-title">GameTime Assigning<br/>Availability Form</h1></div>
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          {isSignUp ? "Create Account" : "Sign In"}
        </h1>
        {error && <div className="bg-red-600 text-white p-2 mb-4 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          {isSignUp && (
            <div>
              <label className="block mb-1 me-3">Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>
          )}
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              placeholder="jane.doe@gmail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
            />
            <div className="mt-1">
              <label className="me-3">Show Password</label>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
            </div>
          </div>
          <button type="submit" className="btn w-full" disabled={loading}>
            {loading ? "Processing…" : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>
        <div className="mt-4 text-center">
          {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-accent underline cursor-pointer"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
        {!isSignUp ? (<div className="mt-4 text-center">
          <button
            onClick={() => {
              sendPasswordResetEmail(auth, email);
              alert(`If you have an account, a recovery email will be sent to ${email === "" ? "the email you have entered here" : email}. Make sure to check your Spam folder.`);
            }}
            className="text-accent underline cursor-pointer"
          >
            {"Forgot Password?"}
          </button>
        </div>) : null}
      </div>
    </div>
  );
}
