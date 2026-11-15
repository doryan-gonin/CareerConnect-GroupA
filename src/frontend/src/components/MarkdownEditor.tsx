import { useRef, useState } from "react";
import MarkdownView from "./MarkdownView";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Describe the role, responsibilities, and requirements...",
  rows = 7,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function insertFormatting(prefix: string, suffix = "", defaultText = "text") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value || "";
    const selected = text.substring(start, end);
    const insertion = selected
      ? `${prefix}${selected}${suffix}`
      : `${prefix}${defaultText}${suffix}`;

    const updated = text.substring(0, start) + insertion + text.substring(end);
    onChange(updated);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + prefix.length + (selected ? selected.length : defaultText.length);
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      {/* Tab bar & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
        {/* Write vs Preview Tabs */}
        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
          <Button
            size="sm"
            variant={activeTab === "write" ? "secondary" : "ghost"}
            type="button"
            onClick={() => setActiveTab("write")}
            className="h-7 px-3 text-xs"
          >
            Write
          </Button>
          <Button
            size="sm"
            variant={activeTab === "preview" ? "secondary" : "ghost"}
            type="button"
            onClick={() => setActiveTab("preview")}
            className="h-7 px-3 text-xs"
          >
            Preview
          </Button>
        </div>

        {/* Formatting Toolbar (shown on Write tab) */}
        {activeTab === "write" && (
          <div className="flex flex-wrap items-center gap-1">
            <Button
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => insertFormatting("**", "**", "bold")}
              title="Bold"
              className="font-bold"
            >
              B
            </Button>
            <Button
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => insertFormatting("*", "*", "italic")}
              title="Italic"
              className="font-serif italic"
            >
              I
            </Button>
            <Button
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => insertFormatting("### ", "", "Heading")}
              title="Heading"
              className="font-semibold"
            >
              H3
            </Button>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Button
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => insertFormatting("- ", "", "List item")}
              title="Bullet List"
            >
              • List
            </Button>
            <Button
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => insertFormatting("1. ", "", "Numbered item")}
              title="Numbered List"
            >
              1. List
            </Button>
            <Button
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => insertFormatting("> ", "", "Quote")}
              title="Quote"
            >
              &ldquo;&rdquo;
            </Button>
            <Button
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => insertFormatting("`", "`", "code")}
              title="Inline Code"
              className="font-mono"
            >
              &lt;/&gt;
            </Button>
            <Button
              size="xs"
              variant="ghost"
              type="button"
              onClick={() => insertFormatting("[", "](https://example.com)", "link text")}
              title="Insert Link"
            >
              Link
            </Button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      {activeTab === "write" ? (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          required={required}
          className="min-h-0 w-full resize-y border-0 p-3 font-sans text-sm leading-relaxed text-foreground shadow-none focus-visible:ring-0"
        />
      ) : (
        <div className="min-h-[160px] overflow-y-auto bg-background p-4">
          {value ? (
            <MarkdownView content={value} />
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Nothing to preview yet. Switch back to Write to compose your description in Markdown.
            </p>
          )}
        </div>
      )}

      {/* Footer hint */}
      <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>Markdown supported: headers (#), bold (**text**), lists (- or 1.), and links</span>
        <span>{value?.length || 0} characters</span>
      </div>
    </div>
  );
}
