"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useAuth, UserButton } from "@clerk/nextjs";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#blog", label: "Blog" },
  { href: "#docs", label: "Docs" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isLoaded, userId } = useAuth();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 0);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSignedIn = isMounted && isLoaded && !!userId;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-border/40 bg-background/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            ⚡ SocialCopilot
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {!isSignedIn ? (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-500 shadow-md">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <UserButton />
            </>
          )}
        </div>

        {/* Mobile Hamburger Navigation */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              }
            />
            <SheetContent side="right" className="w-[300px] border-l bg-background p-6">
              <div className="flex flex-col gap-6 mt-6">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                    ⚡ SocialCopilot
                  </span>
                </Link>
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="h-px bg-border/40" />
                <div className="flex flex-col gap-3">
                  {!isSignedIn ? (
                    <>
                      <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-500">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Dashboard
                        </Button>
                      </Link>
                      <div className="flex justify-center mt-2">
                        <UserButton />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
