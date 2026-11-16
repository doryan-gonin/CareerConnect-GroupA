import ApplicationsSection from "./ApplicationsSection";
import ProfileSection from "./ProfileSection";
import ResumeSection from "./ResumeSection";
import { Button } from "./ui/button";

type LoggedInScreenProps = {
  token: string;
  onViewAnalytics: () => void;
  onLogout?: () => void | Promise<void>;
};

function LoggedInScreen({ token, onViewAnalytics }: LoggedInScreenProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal profile, uploaded resumes, and job applications.
          </p>
        </div>
        <Button type="button" onClick={onViewAnalytics}>
          View analytics
        </Button>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <ProfileSection token={token} />
        <ResumeSection token={token} />
      </div>
      <ApplicationsSection token={token} />
    </div>
  );
}

export default LoggedInScreen;
