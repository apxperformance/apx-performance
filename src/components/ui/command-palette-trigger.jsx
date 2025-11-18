import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import CommandPalette from "./command-palette";

export default function CommandPaletteTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex px-1.5 py-0.5 rounded bg-secondary border border-border text-xs">
          ⌘K
        </kbd>
      </button>
      
      <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}