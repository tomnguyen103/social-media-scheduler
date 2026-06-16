"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type MobileSidebarProps = {
  plan: "free" | "pro" | "agency";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileSidebar({ plan, open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[240px] p-0 border-r-0">
        <div className="h-full" onClick={() => onOpenChange(false)}>
          <Sidebar plan={plan} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
