"use client";

import { useSignUp } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  //   if (fetchStatus === "fetching" || !signUp) {
  //     return <div>Loading...</div>;
  //   }
  async function submit(e: React.SubmitEvent) {
    e.preventDefault();
    console.log(fetchStatus);
    if (fetchStatus === "fetching" || !signUp) {
      return;
    }

    try {
      console.log("Email:", emailAddress);
      console.log("Password:", password);
      const signUpResult = await signUp.create({
        emailAddress,
        password,
      });
      console.log(JSON.stringify(signUpResult, null, 2));
      if (signUpResult.error) {
        toast.error(signUpResult.error.message);
        return;
      }
      const verificationResult = await signUp.verifications.sendEmailCode();
      console.log(JSON.stringify(verificationResult, null, 2));
      if (verificationResult.error) {
        toast.error(verificationResult.error.message);
        return;
      }
      setPendingVerification(true);
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
      setError("Something went wrong");
    }
  }
  async function verify(e: React.SubmitEvent) {
    e.preventDefault();
    if (fetchStatus === "fetching" || !signUp) {
      return;
    }
    try {
      const verified = await signUp.verifications.verifyEmailCode({
        code,
      });
      if (signUp.status != "complete") {
        setError("Signup failed");
        console.log(JSON.stringify(signUp, null, 2));
      }
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: (url) => router.push("/dashboard"),
        });
      }

      setPendingVerification(false);
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
      setError("Something went wrong");
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sign Up for Todo Master
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!pendingVerification ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full">
                Sign Up
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full">
                Verify Email
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
      <div id="clerk-captcha" />
    </div>
  );
}
