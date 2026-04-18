import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteItem } from "@/hooks/useTripItems";

interface ClearAllButtonProps {
  tripId: string;
  /** IDs of items this button will delete — caller decides what to keep (e.g. selected flights/hotels). */
  itemIds: string[];
  /** e.g. "flights", "hotels", "restaurants", "attractions" */
  label: string;
  /** Optional line shown under the main message — use for "Selected X will be kept." */
  note?: string;
}

export function ClearAllButton({ tripId, itemIds, label, note }: ClearAllButtonProps) {
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const deleteItem = useDeleteItem(tripId);

  if (itemIds.length === 0) return null;

  async function handleConfirm() {
    setClearing(true);
    try {
      await Promise.all(itemIds.map((id) => deleteItem.mutateAsync(id)));
      toast.success(`Cleared ${itemIds.length} ${label}`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to clear ${label}`);
    } finally {
      setClearing(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Clear all
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear all {label}?</DialogTitle>
            <DialogDescription>
              {itemIds.length} {label} will be removed from this trip. This can&apos;t be undone.
              {note && <span className="mt-2 block text-foreground">{note}</span>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={clearing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={clearing}
              className="gap-2"
            >
              {clearing && <Loader2 className="h-4 w-4 animate-spin" />}
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
