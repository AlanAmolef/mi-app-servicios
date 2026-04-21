"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (!installPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: 12,
        right: 12,
        zIndex: 9999,
      }}
    >
      <button
        onClick={handleInstallClick}
        style={{
          width: "100%",
          backgroundColor: "#2563eb",
          color: "#ffffff",
          border: "none",
          borderRadius: "12px",
          padding: "14px 16px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
        }}
      >
        Instalar app
      </button>
    </div>
  );
}