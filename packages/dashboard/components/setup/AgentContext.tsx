"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface AgentContextProps {
  value: string;
  onChange: (value: string) => void;
}

export function AgentContext({ value, onChange }: AgentContextProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Agent Context
        </CardTitle>
        <CardDescription>
          Provide custom instructions to guide the agent during codebase analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-context">Custom Instructions</Label>
          <Textarea
            id="agent-context"
            placeholder={`Example instructions:

- This is an e-commerce application for selling digital products
- Focus on user-facing features like checkout, account management, and product browsing
- The main user personas are customers and administrators
- Use friendly, conversational language in the documentation`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground">
            These instructions help the AI understand your product context and generate
            more relevant documentation
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
