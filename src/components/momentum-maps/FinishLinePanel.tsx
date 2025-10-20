import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Edit2, Check, X } from "lucide-react";

interface FinishLinePanelProps {
  criteria: string[];
  onUpdate: (criteria: string[]) => void;
}

export function FinishLinePanel({ criteria, onUpdate }: FinishLinePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCriteria, setEditedCriteria] = useState(criteria.join('\n'));

  const handleSave = () => {
    const newCriteria = editedCriteria
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    if (newCriteria.length > 0) {
      onUpdate(newCriteria);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedCriteria(criteria.join('\n'));
    setIsEditing(false);
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Flag className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Finish Line</CardTitle>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              aria-label="Edit finish line criteria"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          You'll know you're done when:
        </p>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedCriteria}
              onChange={(e) => setEditedCriteria(e.target.value)}
              className="min-h-[150px]"
              placeholder="Enter each criterion on a new line..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {criteria.map((criterion, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span className="text-sm">{criterion}</span>
              </li>
            ))}
          </ul>
        )}

        {!isEditing && criteria.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No criteria defined yet. Click edit to add some!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
