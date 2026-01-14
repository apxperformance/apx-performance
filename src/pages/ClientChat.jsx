import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, MessageSquare, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function UnifiedChat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null); // 'coach' or 'client'
  const [isLoading, setIsLoading] = useState(true);

  // Coach State
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Shared Chat State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  // 1. INITIALIZE: Detect User & Role
  useEffect(() => {
    const init = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        // Check Role (Adjust logic if your role system is different)
        if (user.role === 'coach' || user.is_coach) {
          setRole('coach');
          // Load Clients for Coach
          const myClients = await base44.entities.Client.filter({ coach_id: user.id });
          setClients(myClients);
        } else {
          setRole('client');
          // No extra load needed for client initially
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // 2. FETCH MESSAGES (Runs for both, but logic differs)
  useEffect(() => {
    if (!currentUser) return;
    
    // If Coach: Don't fetch until a client is selected
    if (role === 'coach' && !selectedClient) return;

    // Determine the "Other Person" ID
    const otherPersonId = role === 'coach' ? selectedClient?.id : currentUser.coach_id;
    if (!otherPersonId) return;

    const fetchMessages = async () => {
      try {
        const sent = await base44.entities.Message.filter({ sender_id: currentUser.id, recipient_id: otherPersonId });
        const received = await base44.entities.Message.filter({ sender_id: otherPersonId, recipient_id: currentUser.id });
        
        const all = [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        setMessages(all);
        // Only auto-scroll if it's the first load or we are near bottom
        // setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); 
    return () => clearInterval(interval);
  }, [currentUser, role, selectedClient]);

  // 3. AUTO SCROLL
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedClient]); // Scroll when messages change or coach switches client

  // 4. SEND MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const recipientId = role === 'coach' ? selectedClient?.id : currentUser?.coach_id;
    
    if (!newMessage.trim() || !recipientId) return;

    const tempMsg = {
      id: Date.now(),
      content: newMessage,
      sender_id: currentUser.id,
      recipient_id: recipientId,
      created_date: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage("");

    try {
      await base44.entities.Message.create({
        content: tempMsg.content,
        sender_id: currentUser.id,
        recipient_id: recipientId,
        read: false
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground"/></div>;
  }

  // --- VIEW 1: COACH INTERFACE ---
  if (role === 'coach') {
    const filteredClients = clients.filter(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="flex h-[calc(100vh-2rem)] gap-6 p-6 overflow-hidden">
        {/* Coach Sidebar */}
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
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                    selectedClient?.id === client.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary/80 text-foreground"
                  )}
                >
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={client.avatar_url} />
                    <AvatarFallback>{client.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{client.full_name}</p>
                    <p className="text-xs opacity-70 truncate">Click to chat</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Coach Chat Area */}
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
                    <p className="text-xs text-green-500 flex items-center gap-1">Online</p>
                  </div>
              </div>
              <ChatWindow 
                messages={messages} 
                currentUserId={currentUser.id} 
                scrollRef={scrollRef} 
                newMessage={newMessage} 
                setNewMessage={setNewMessage} 
                handleSendMessage={handleSendMessage} 
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-12 h-12 opacity-50 mb-4" />
              <h3>Select a client to start chatting</h3>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: CLIENT INTERFACE ---
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-4 mb-4 p-4 bg-card/50 backdrop-blur-xl border border-border rounded-xl">
        <Avatar className="h-12 w-12 border border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary font-bold">CO</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold text-foreground">Coach Chat</h1>
          <p className="text-sm text-muted-foreground">Ask questions or send updates</p>
        </div>
      </div>

      <div className="flex-1 bg-card/50 backdrop-blur-xl border border-border rounded-xl overflow-hidden flex flex-col shadow-lg">
        <ChatWindow 
          messages={messages} 
          currentUserId={currentUser.id} 
          scrollRef={scrollRef} 
          newMessage={newMessage} 
          setNewMessage={setNewMessage} 
          handleSendMessage={handleSendMessage}
          isClientView={true}
        />
      </div>
    </div>
  );
}

// Helper Component to avoid code duplication
function ChatWindow({ messages, currentUserId, scrollRef, newMessage, setNewMessage, handleSendMessage, isClientView }) {
  return (
    <>
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="flex flex-col space-y-4">
          {messages.length === 0 ? (
             <div className="text-center text-muted-foreground py-10 opacity-50"><p>No messages yet.</p></div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id || i} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm", isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary text-secondary-foreground rounded-bl-none")}>
                    <p>{msg.content}</p>
                    <span className={cn("text-[10px] block mt-1 opacity-70", isMe ? "text-right" : "text-left")}>
                      {new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              )
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="p-4 bg-background/50 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder={isClientView ? "Message your coach..." : "Type a message..."} 
            className="bg-background border-border" 
          />
          <Button type="submit" disabled={!newMessage.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}