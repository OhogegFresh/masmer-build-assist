import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2, Phone, MapPin } from "lucide-react";

export interface CustomerLeadPipeProps {
  open: boolean;
  onClose: () => void;
  customerName?: string;
  callerPhone?: string | null;
  jobAddress?: string | null;
}

export function CustomerLeadPipe({ open, onClose, customerName, callerPhone, jobAddress }: CustomerLeadPipeProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-card border-border">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">{customerName ?? "Customer"}</SheetTitle>
          <SheetDescription className="space-y-1">
            {callerPhone && (
              <span className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-orange" /> {callerPhone}
              </span>
            )}
            {jobAddress && (
              <span className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-orange" /> {jobAddress}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-orange" />
          <p className="text-sm">Loading customer pipeline…</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
