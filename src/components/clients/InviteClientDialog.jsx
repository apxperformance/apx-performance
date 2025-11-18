
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User } from "lucide-react";

export default function InviteClientDialog({ isOpen, onClose, onInvite }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onInvite({ full_name: name, email });
    setIsSubmitting(false);
    setName("");
    setEmail("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Mail className="w-6 h-6 text-[#C5B358]" />
            Invite New Client
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your client's details below. They will receive an email invitation to join the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="name"
                  placeholder="e.g., Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 bg-gray-800 border-gray-700 focus:border-[#C5B358]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-gray-800 border-gray-700 focus:border-[#C5B358]"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-gray-800 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 hover:bg-gray-800">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
