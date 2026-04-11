import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useCreateItem } from "./useTripItems";
import type { TripItemCategory } from "@/lib/types";

interface PendingItem {
  category: TripItemCategory;
  data: Record<string, unknown>;
  label: string;
}

export function useSaveToTrip() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const createItem = useCreateItem(selectedTripId ?? undefined);

  const openDialog = useCallback(
    (category: TripItemCategory, data: Record<string, unknown>, label: string) => {
      setPendingItem({ category, data, label });
      setIsOpen(true);
    },
    [],
  );

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setPendingItem(null);
    setSelectedTripId(null);
  }, []);

  const confirmSave = useCallback(
    async (tripId: string) => {
      if (!pendingItem) return;
      setSelectedTripId(tripId);
      try {
        await createItem.mutateAsync({
          category: pendingItem.category,
          data: pendingItem.data,
        });
        toast.success(`Saved "${pendingItem.label}" to trip`);
        closeDialog();
      } catch {
        toast.error("Failed to save item — try again");
      }
    },
    [pendingItem, createItem, closeDialog],
  );

  return {
    isOpen,
    pendingItem,
    openDialog,
    closeDialog,
    confirmSave,
    isSaving: createItem.isPending,
  };
}
