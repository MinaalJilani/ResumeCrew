import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  logoSrc: string;
  logoAlt?: string;
  title: string;
  description?: string;
  primaryAction: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }[];
  skipAction?: {
    label: string;
    onClick: () => void;
  };
  footerContent?: React.ReactNode;
}

const AuthForm = React.forwardRef<HTMLDivElement, AuthFormProps>(
  (
    {
      className,
      logoSrc,
      logoAlt = "Company Logo",
      title,
      description,
      primaryAction,
      secondaryActions,
      skipAction,
      footerContent,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("w-full max-w-sm", className)} {...props}>
        <Card className="border-border bg-card">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-secondary/50">
              <img
                src={logoSrc}
                alt={logoAlt}
                className="h-8 w-8 rounded object-contain"
              />
            </div>
            <CardTitle className="text-xl text-foreground">{title}</CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full gap-2"
              variant="default"
              onClick={primaryAction.onClick}
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>

            {secondaryActions && secondaryActions.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            <div className="space-y-2">
              {secondaryActions?.map((action, index) => (
                <Button
                  key={index}
                  className="w-full gap-2"
                  variant="outline"
                  onClick={action.onClick}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>

          {skipAction && (
            <CardFooter className="justify-center">
              <Button variant="link" onClick={skipAction.onClick} className="text-muted-foreground">
                {skipAction.label}
              </Button>
            </CardFooter>
          )}
        </Card>

        {footerContent && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {footerContent}
          </p>
        )}
      </div>
    );
  }
);
AuthForm.displayName = "AuthForm";

export { AuthForm };
