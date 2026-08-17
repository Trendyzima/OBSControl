import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Radio, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--card))] border border-border flex items-center justify-center mx-auto mb-5">
          <Radio size={24} className="text-[hsl(var(--live-red))]" />
        </div>
        <p className="font-mono-console text-[hsl(var(--live-red))] text-xs tracking-widest uppercase mb-2">Error 404</p>
        <h1 className="font-mono-console text-2xl font-semibold text-foreground mb-2">Signal Lost</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page at <code className="font-mono-console text-xs bg-secondary px-1.5 py-0.5 rounded">{location.pathname}</code> does not exist.
        </p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 font-mono-console text-xs text-foreground transition-colors"
        >
          <ArrowLeft size={13} />
          Return to Control Panel
        </button>
      </div>
    </div>
  );
};

export default NotFound;
