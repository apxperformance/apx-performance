import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X, Mail, MessageSquare, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function ConnectionRequestsSection({ 
  requests, 
  onAccept, 
  onReject, 
  isProcessing 
}) {
  if (requests.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card className="bg-card/50 backdrop-blur-xl border-[#C5B358]/30 border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <UserPlus className="w-5 h-5 text-[#C5B358]" />
              Pending Connection Requests
            </CardTitle>
            <Badge className="bg-[#C5B358] text-black font-semibold">
              {requests.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            New clients want to join your program. Review and accept or decline their requests.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="bg-secondary/30 border-border hover:border-[#C5B358]/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 flex-shrink-0 border border-[#C5B358]">
                        <AvatarImage src={null} alt={request.client_name} />
                        <AvatarFallback className="bg-[#C5B358]/20 text-[#C5B358] font-bold">
                          {request.client_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-semibold text-foreground">{request.client_name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {request.client_email}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {format(new Date(request.created_date), 'MMM d')}
                          </Badge>
                        </div>

                        {/* Message */}
                        {request.message && (
                          <div className="mb-3 p-3 bg-card/50 rounded-lg border border-border">
                            <div className="flex items-start gap-2 mb-1">
                              <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-xs font-semibold text-muted-foreground">CLIENT MESSAGE</p>
                            </div>
                            <p className="text-sm text-foreground">{request.message}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => onAccept(request)}
                            disabled={isProcessing}
                            className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white font-semibold flex-1"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(request)}
                            disabled={isProcessing}
                            className="border-[hsl(var(--destructive))] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 flex-1"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}