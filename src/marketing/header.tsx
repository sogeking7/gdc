"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Briefcase, Moon, Sun } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "./navlink";
import {
  onIdTokenChanged,
  signInWithGoogle,
  signOut,
} from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { setCookie, deleteCookie } from "cookies-next";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explore", label: "Explore Careers" },
  { href: "/resume", label: "Resume Builder" },
  {
    href: "https://ai-technical-interviewer-201743667943.us-west1.run.app",
    label: "Mock Interview",
  },
  { href: "/onboarding", label: "Onboarding" },
];

function useUserSession(initialUser: User | null) {
  useEffect(() => {
    return onIdTokenChanged(async (user: User | null) => {
      if (user) {
        const idToken = await user.getIdToken();
        await setCookie("__session", idToken);
      } else {
        await deleteCookie("__session");
      }
      if (initialUser?.uid === user?.uid) {
        return;
      }
      window.location.reload();
    });
  }, [initialUser]);

  return initialUser;
}

export const Header = ({ initialUser }: { initialUser: User | null }) => {
  const user = useUserSession(initialUser);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const initials = getInitials(user?.displayName || "", user?.email || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    signOut();
  };

  const handleSignIn = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    signInWithGoogle();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-border bg-background/80 px-4 sm:px-8 md:px-10 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <Link href="/">
          <div className="flex items-center gap-3 text-foreground">
            <Briefcase className="h-6 w-6 text-primary" />
            <h2 className="text-lg font-bold leading-tight tracking-tight">
              Career Assistant
            </h2>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex flex-1 justify-end gap-3 sm:gap-4 items-center">
        <Button variant="secondary" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <Button
          variant="secondary"
          onClick={toggleTheme}
          size="icon"
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          {!user ? (
            <Button onClick={handleSignIn}>Sign in with Google</Button>
          ) : (
            <Button variant="ghost" asChild className="px-2">
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  {user.email}
                </span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
