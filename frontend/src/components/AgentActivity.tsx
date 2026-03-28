import { motion, AnimatePresence } from "framer-motion";
import { FileText, PenTool, Search, Target, CheckCircle2, Loader2 } from "lucide-react";

export interface AgentStep {
  id: string;
  agent: string;
  icon: "resume" | "cover" | "research" | "interview";
  status: "pending" | "active" | "done";
  message: string;
}

const iconMap = {
  resume: FileText,
  cover: PenTool,
  research: Search,
  interview: Target,
};

const AgentActivity = ({ steps }: { steps: AgentStep[] }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
        Agent Activity
      </h3>
      <div className="space-y-1">
        <AnimatePresence>
          {steps.map((step) => {
            const Icon = iconMap[step.icon];
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  step.status === "active"
                    ? "bg-primary/10 text-primary"
                    : step.status === "done"
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{step.message}</span>
                {step.status === "active" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {step.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentActivity;
