import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface GoalInputProps {
  onSubmit: (goal: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const EXAMPLE_GOALS = [
  "Launch a weekly podcast about vintage synths",
  "Build a mobile app for tracking daily habits",
  "Write and publish my first novel",
  "Start a sustainable urban garden",
  "Learn to play jazz piano",
];

export function GoalInput({ onSubmit, isLoading, error }: GoalInputProps) {
  const [goal, setGoal] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) {
      await onSubmit(goal);
    }
  };

  const handleExampleClick = (example: string) => {
    setGoal(example);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-8 sm:p-12 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Break big goals into momentum
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your goal and let AI transform it into a clear, actionable plan with bite-sized steps.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="goal" className="block text-sm font-semibold mb-3">
              What do you want to achieve?
            </label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Launch a weekly podcast about vintage synths"
              className="min-h-[120px] text-lg resize-none"
              disabled={isLoading}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {goal.length}/500 characters
              </span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!goal.trim() || isLoading}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Building your map...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Build My Map
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t">
          <p className="text-sm font-semibold text-muted-foreground mb-3">
            Need inspiration? Try these:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_GOALS.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1.5 text-sm rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                type="button"
                disabled={isLoading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
