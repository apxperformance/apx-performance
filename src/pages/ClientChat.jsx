import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function CoachChat() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const scrollRef = useRef(null);

  // 1. Init: Load Coach & Clients
  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const myClients = await base44.entities.Client.filter({ coach_id: user.id });
        setClients(myClients);
      } catch (error) {
        console.error("Error loading chat:", error);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // 2. Fetch Messages when Client Selected
  useEffect(() => {
    if (!selectedClient || !currentUser) return;
    const fetchMessages = async () => {
      try {
        const sent = await base44.entities.Message.filter({ sender_id: currentUser.id, recipient_id: selectedClient.id });
        const received = await base44.entities.Message.filter({ sender_id: selectedClient.id, recipient_id: currentUser.id });
        
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
  }, [selectedClient, currentUser]);

  // 3. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient) return;

    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      content: newMessage,
      sender_id: currentUser.id,
      recipient_id: selectedClient.id,
      created_date: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      await base44.entities.Message.create({
        content: optimisticMsg.content,
        sender_id: currentUser.id,
        recipient_id: selectedClient.id,
        read: false
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6 p-6 overflow-hidden">
      {/* Sidebar: Client List */}
      <div className="w-80 flex flex-col gap-4 bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50" 
          />
        </div>
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                    selectedClient?.id === client.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-secondary/80 text-foreground"
                  )}
                >
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={client.avatar_url} />
                    <AvatarFallback>{client.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{client.full_name}</p>
                    <p className={cn("text-xs truncate", selectedClient?.id === client.id ? "text-primary-foreground/70" : "text-muted-foreground")}>Click to chat</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8 text-sm">No clients found</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-card/50 backdrop-blur-xl border border-border rounded-xl">
        {selectedClient ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3 bg-background/30">
               <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedClient.avatar_url} />
                  <AvatarFallback>{selectedClient.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground">{selectedClient.full_name}</h2>
                  <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 block"></span> Online</p>
                </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 flex flex-col">
                {messages.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-50"><MessageSquare className="w-12 h-12 mb-2" /><p>No messages yet.</p></div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id || i} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary text-secondary-foreground rounded-bl-none")}>
                          {msg.content}
                          <div className={cn("text-[10px] mt-1 opacity-70", isMe ? "text-right" : "text-left")}>{new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="bg-background border-border" />
                <Button type="submit" size="icon" disabled={!newMessage.trim()} className="shrink-0 bg-primary hover:bg-primary/90"><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="bg-secondary/50 p-6 rounded-full mb-4"><MessageSquare className="w-12 h-12 opacity-50" /></div>
            <h3 className="text-xl font-semibold text-foreground">Select a client to start messaging</h3>
          </div>
        )}
      </div>
    </div>
  );
}