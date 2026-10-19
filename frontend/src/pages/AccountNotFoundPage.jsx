import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { UserX } from "lucide-react";
import { StatusMessagePage } from "mws-central-auth";
import AnimatedPage from "@/components/AnimatedPage";

// Fallback only - confirm the real support inbox with the team before relying on this.
const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "admin@millennia21.id";

// Matches this app's shadcn/ui CSS variables so the page looks native here
// (dark-mode aware). StatusMessagePage itself makes no assumption about
// these variables existing - other apps can pass their own theme or none.
const THEME = {
  cardBackground: "hsl(var(--card) / 0.6)",
  cardBorder: "hsl(var(--border) / 0.4)",
  primary: "hsl(var(--primary))",
  primaryForeground: "hsl(var(--primary-foreground))",
  foreground: "hsl(var(--foreground))",
  mutedForeground: "hsl(var(--muted-foreground))",
};

export default function AccountNotFoundPage() {
  const navigate = useNavigate();

  const actions = [
    { label: "Back to the Hub", onClick: () => navigate("/mtss") },
    { label: "Contact Administrator", href: `mailto:${SUPPORT_EMAIL}` },
  ];

  return (
    <AnimatedPage>
      <Helmet>
        <title>No Access to MTSS</title>
      </Helmet>
      <StatusMessagePage
        icon={<UserX className="h-10 w-10" />}
        title="No Access to MTSS"
        message="Your account is signed in to the Hub, but it has no access to MTSS. If that is a mistake, contact the administrator."
        actions={actions}
        theme={THEME}
        startDelay={0.5}
      />
    </AnimatedPage>
  );
}
