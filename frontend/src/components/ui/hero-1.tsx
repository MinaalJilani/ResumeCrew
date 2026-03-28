"use client";

import * as React from "react";
import { Paperclip, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero1 = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Gradient Orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 right-20 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px]" />
        <div className="absolute bottom-20 left-20 h-[250px] w-[250px] rounded-full bg-accent/5 blur-[60px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">
            ResumeCrew<span className="text-primary">.</span>
          </span>
        </div>
        <Link
          to="/login"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get Started
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-20 md:pt-24">
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex animate-slide-up items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span>✨</span>
            <span>Introducing ResumeCrew Assistant</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Land Your Dream Job{" "}
            <span className="gradient-text">Effortlessly</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            ResumeCrew can craft resumes, cover letters, and interview prep with just a few lines of prompt.
          </p>

          {/* Search bar */}
          <div className="mb-8 w-full max-w-2xl">
            <div className="glass flex items-center gap-3 rounded-xl px-4 py-3">
              <Paperclip className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Paste a job description or ask anything..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Suggestion pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              "Generate a tailored resume",
              "Write a cover letter",
              "Prepare for interviews",
              "Research a company",
              "Get career advice",
            ].map((pill) => (
              <span
                key={pill}
                className="cursor-pointer rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export { Hero1 };
