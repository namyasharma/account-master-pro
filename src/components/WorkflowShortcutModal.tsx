import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WorkflowShortcutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actions: {
    label: string;
    path: string;
  }[];
}

export function WorkflowShortcutModal({
  open,
  onOpenChange,
  title,
  description,
  actions,
}: WorkflowShortcutModalProps) {
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => handleAction(action.path)}
              variant={index === 0 ? 'default' : 'secondary'}
              className="w-full"
            >
              {action.label}
            </Button>
          ))}
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
