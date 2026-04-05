"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DismissibleAlertProps {
  storageKey: string;
  variant?: "default" | "info" | "destructive";
  icon?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function DismissibleAlert({
  storageKey,
  variant = "default",
  icon,
  title,
  children,
  className,
}: DismissibleAlertProps) {
  const [dismissed, setDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === "true";
    setDismissed(isDismissed);
  }, [storageKey]);

  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(storageKey, "true");
    setDismissed(true);
  }

  return (
    <Alert variant={variant} className={`relative ${className ?? ""}`}>
      {icon}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-6 text-muted-foreground hover:text-foreground"
        onClick={handleDismiss}
        aria-label="닫기"
      >
        <X className="size-3.5" />
      </Button>
    </Alert>
  );
}
