import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, MapPin } from "lucide-react";

export default function ViewAddressesButton({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    api
      .get(`/users/${userId}`)
      .then((res) => {
        if (!mounted) return;
        setAddresses(res.data.addresses || []);
      })
      .catch(() => setAddresses([]));
    return () => {
      mounted = false;
    };
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Eye /> View</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Addresses
            </div>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-2">
          {addresses.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">
              No addresses
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((a: any, i: number) => (
                <div key={i} className="rounded-md border p-2">
                  <div className="text-sm">
                    {a.city} {a.area ? `• ${a.area}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.street} {a.building ? `• ${a.building}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
