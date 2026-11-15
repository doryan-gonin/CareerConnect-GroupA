import { useEffect, useRef, useState } from "react";
import { getInterviewSession, sendInterviewMessage } from "../api/interview";
import { interviewMessageFormSchema } from "../api/schemas";
import MarkdownView from "./MarkdownView";
import type { InterviewMessage, InterviewSession } from "../api/types";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";
import { cn } from "cn";

const MAX_MESSAGE_CHARS = 2000;

type InterviewConversationProps = { token: string; sessionId: number; onBack: () => void };

function InterviewConversation({ token, sessionId, onBack }: InterviewConversationProps) {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const windowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    getInterviewSession(token, sessionId)
      .then((data) => {
        if (isMounted) {
          setSession(data);
          setMessages(data.messages);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token, sessionId]);

  useEffect(() => {
    if (windowRef.current) windowRef.current.scrollTop = windowRef.current.scrollHeight;
  }, [messages, isSending]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || isSending) return;
    const parsedMessage = interviewMessageFormSchema.safeParse({ content });
    if (!parsedMessage.success) {
      setError(parsedMessage.error.issues[0]?.message ?? "Enter a message before sending.");
      return;
    }
    const previousMessages = messages;
    setMessages([...messages, { role: "user", content: parsedMessage.data.content }]);
    setDraft("");
    setError("");
    setIsSending(true);
    try {
      const reply = await sendInterviewMessage(token, sessionId, parsedMessage.data.content);
      setMessages((current) => [...current, reply]);
    } catch (err: unknown) {
      setMessages(previousMessages);
      setDraft(content);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button type="button" variant="link" onClick={onBack} className="self-start px-0">
        ← Back to sessions
      </Button>
      {isLoading ? (
        <div className="flex flex-col gap-3 py-6" aria-label="Loading session">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-[28rem] w-full" />
        </div>
      ) : !session ? (
        <Alert variant="destructive">
          <AlertDescription>{error || "Unable to load this session."}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{session.job_title}</CardTitle>
            <p className="text-sm text-muted-foreground">{session.company_name}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div
              ref={windowRef}
              className="flex h-[28rem] flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/30 p-3"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "self-end whitespace-pre-wrap bg-primary text-primary-foreground"
                      : "self-start bg-muted text-foreground",
                  )}
                >
                  {message.role === "user" ? (
                    message.content
                  ) : (
                    <MarkdownView content={message.content} />
                  )}
                </div>
              ))}
              {isSending && (
                <div className="self-start rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              )}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-end gap-2">
              <Textarea
                rows={2}
                value={draft}
                maxLength={MAX_MESSAGE_CHARS}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer or question"
                aria-label="Message"
                className="resize-none"
              />
              <Button
                type="button"
                onClick={() => void handleSend()}
                disabled={isSending || !draft.trim()}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InterviewConversation;
