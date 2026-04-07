"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileChatInputProps {
  businessId: string;
}

export function MobileChatInput({
  businessId: _businessId,
}: MobileChatInputProps): React.JSX.Element {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // Navigate to chat page with pre-filled message
    router.push(`/chat?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t bg-white px-3 py-2.5"
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="점장에게 물어보세요..."
        className="flex-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm outline-none"
      />
      <Button
        type="submit"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-lg"
        disabled={!input.trim()}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </form>
  );
}
