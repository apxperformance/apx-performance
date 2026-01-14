import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ClientChat() {
  const [coach, setCoach] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const scrollRef = useRef(null);

  // 1. Init: Load Client & Their Coach
  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        if (user.coach_id) {
          const coachUsers = await base44.entities.User.filter({ id: user.coach_id });
          if (coachUsers.length > 0) {
            setCoach(coachUsers[0]);
          }
        }
      } catch (error) {
        console.error("Error loading chat:", error);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // 2. Fetch Messages with Coach
  useEffect(() => {
    if (!coach || !currentUser) return;
    const fetchMessages = async () => {
      try {
        const sent = await base44.entities.ChatMessage.filter({ 
          sender_id: currentUser.id, 
          coach_id: coach.id 
        });
        const received = await base44.entities.ChatMessage.filter({ 
          sender_id: coach.id, 
          client_id: currentUser.id 
        });
        
        const all = [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        setMessages(all);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); 
    return () => clearInterval(interval);
  }, [coach, currentUser]);

  // 3. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !coach) return;

    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      message: newMessage,
      sender_id: currentUser.id,
      sender_type: 'client',
      coach_id: coach.id,
      client_id: currentUser.id,
      created_date: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      await base44.entities.ChatMessage.create({
        message: optimisticMsg.message,
        sender_id: currentUser.id,
        sender_type: 'client',
        coach_id: coach.id,
        client_id: currentUser.id,
        message_type: 'text'
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-2rem)] p-6">
        <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser?.coach_id || !coach) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-2rem)] p-6 text-center">
        <div className="bg-secondary/50 p-6 rounded-full mb-4">
          <MessageSquare className="w-12 h-12 opacity-50 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No Coach Assigned</h3>
        <p className="text-muted-foreground">You need to be assigned to a coach to use chat.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] p-6 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-card/50 backdrop-blur-xl border border-border rounded-xl">
        <div className="p-4 border-b border-border flex items-center gap-3 bg-background/30">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={coach.profile_image} />
            <AvatarFallback className="bg-gradient-to-r from-gray-600 to-gray-800 text-white">
              <Crown className="w-6 h-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-foreground">{coach.full_name}</h2>
            <p className="text-xs text-muted-foreground">Your Coach</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 flex flex-col">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-50">
                <MessageSquare className="w-12 h-12 mb-2" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    key={msg.id || i} 
                    className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", 
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-br-none" 
                        : "bg-secondary text-secondary-foreground rounded-bl-none"
                    )}>
                      {msg.message}
                      <div className={cn("text-[10px] mt-1 opacity-70", isMe ? "text-right" : "text-left")}>
                        {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-background/30">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder="Type a message..." 
              className="bg-background border-border" 
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim()} 
              className="shrink-0 bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}