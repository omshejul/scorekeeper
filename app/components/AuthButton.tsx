"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Loader } from "lucide-react";
import { FaApple } from "react-icons/fa";
import { useState } from "react";
import Image from "next/image";

export function AuthButton() {
  const { data: session, status } = useSession();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [isAppleSigningIn, setIsAppleSigningIn] = useState(false);
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
      <div className="flex items-center border border-background/50 bg-background/50 backdrop-blur-md py-2 px-2.5 rounded-full justify-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Avatar className="w-8 h-8">
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
          className="flex items-center rounded-full gap-2"
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
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setIsGoogleSigningIn(true);
            try {
              await signIn("google");
            } finally {
              setIsGoogleSigningIn(false);
            }
          }}
          disabled={isGoogleSigningIn}
          className="!px-8 py-2 flex items-center gap-2 rounded-full"
        >
          {isGoogleSigningIn ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Image
              src="/google.webp"
              alt="Google logo"
              width={16}
              height={16}
              className="w-4 h-4"
            />
          )}
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            setIsAppleSigningIn(true);
            try {
              await signIn("apple");
            } finally {
              setIsAppleSigningIn(false);
            }
          }}
          disabled={isAppleSigningIn}
          className="!px-8 py-2 flex border border-neutral-500/50 items-center gap-2 rounded-full bg-black text-white hover:bg-gray-900"
        >
          {isAppleSigningIn ? (
            <Loader className="w-4 h-4 animate-spin text-white" />
          ) : (
            <FaApple className="w-4 h-4 text-white" />
          )}
        </Button>
      </div>
      <span className="text-xs text-center w-full text-gray-500 whitespace-nowrap">
        Sign in to save and share your scores
      </span>
    </div>
  );
}
