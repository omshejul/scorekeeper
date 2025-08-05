"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Loader } from "lucide-react";
import { useState } from "react";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (status === "loading") {
    return (
      <Button variant="outline" disabled className="flex items-center gap-2">
        <Loader className="w-4 h-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center bg-background/50 backdrop-blur-lg py-3 px-5 rounded-full justify-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Avatar className="w-6 h-6">
            <AvatarImage src={session.user?.image || ""} />
            <AvatarFallback>
              {session.user?.name
                ? session.user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : session.user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="whitespace-nowrap">
            {session.user?.name || session.user?.email}
          </span>
        </div>
        <Button
          variant={"outline"}
          size="sm"
          onClick={async () => {
            setIsSigningOut(true);
            try {
              await signOut();
            } finally {
              setIsSigningOut(false);
            }
          }}
          disabled={isSigningOut}
          className="flex items-center gap-2"
        >
          {isSigningOut ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Signing Out...
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              Sign Out
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <Button
        variant="outline"
        onClick={async () => {
          setIsSigningIn(true);
          try {
            await signIn("google");
          } finally {
            setIsSigningIn(false);
          }
        }}
        disabled={isSigningIn}
        className="flex items-center gap-2"
      >
        {isSigningIn ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <img src="/google.webp" alt="Google logo" className="w-4 h-4" />
            Sign In
          </>
        )}
      </Button>
      <span className="text-xs text-center w-full text-gray-500 whitespace-nowrap">
        Sign in to save and share your scores
      </span>
    </div>
  );
}
