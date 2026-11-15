import { Bookmark } from "lucide-react";
import { cn } from "cn";
import { Button } from "./ui/button";

interface SavedJobButtonProps {
  isSaved: boolean;
  isPending?: boolean;
  onToggle: () => void;
}

function SavedJobButton({ isSaved, isPending = false, onToggle }: SavedJobButtonProps) {
  return (
    <Button
      size="icon-lg"
      variant={isSaved ? "secondary" : "outline"}
      type="button"
      aria-label={isSaved ? "Remove saved job" : "Save job"}
      aria-pressed={isSaved}
      disabled={isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      className={cn("rounded-full", isSaved && "text-primary")}
      title={isSaved ? "Remove from saved jobs" : "Save job"}
    >
      <Bookmark aria-hidden="true" className={cn(isSaved && "fill-current")}></Bookmark>
    </Button>
  );
}

export default SavedJobButton;
