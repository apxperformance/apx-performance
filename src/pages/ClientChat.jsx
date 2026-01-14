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

// --- 1. SMART ENTITY SELECTOR ---
// Detects the correct table name (lowercase or capitalized) automatically
const getChatEntity = () => {
  if (base44.entities.chatmessage) return base44.entities.chatmessage;
  if (base44.entities.ChatMessage) return base44.entities.ChatMessage;
  // Fallback
  return null;
};

// --- HELPER: Browser Timezone Formatter ---
const formatMessageTime = (dateString) => {
  if (!dateString) return "";
  // Force browser to interpret as UTC so it converts to Local Time
  const safeDate = dateString.endsWith("Z") ? dateString : dateString + "Z";
  return new Date(safeDate).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// --- 2. COACH VIEW ---
function CoachChatView({ currentUser }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef(null);

  // Load Clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        if (!base44.entities.Client) return;
        const myClients = await base44.entities.Client.filter({ coach_id: currentUser.id });
        setClients(myClients);
      } catch (error) {
        console.error("Error loading clients", error);
      }
      setIsLoading(false);
    };
    loadClients();
  }, [currentUser]);

  // Load Messages (SAFE MODE: Filter on Frontend)
  useEffect(() => {
    if (!selectedClient) return;
    
    const fetchMessages = async () => {
      const ChatEntity = getChatEntity();
      if (!ChatEntity) return;

      try {
        const targetClientId = selectedClient.user_id || selectedClient.id;

        // SAFE MODE: Only ask for messages for this CLIENT.
        // We avoid complex "AND" filters that crash the server.
        const allClientMessages = await ChatEntity.filter({ 
          client_id: targetClientId 
        });

        // Filter: Keep only messages involving me (the coach)
        const myConversation = allClientMessages.filter(msg => 
            msg.coach_id === currentUser.id
        );

        setMessages(myConversation.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); 
    return () => clearInterval(interval);
  }, [selectedClient, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient) return;
    
    const ChatEntity = getChatEntity();
    if (!ChatEntity) {
        toast.error("Database Error: Chat table not found");
        return;
    }

    const msgContent = newMessage;
    setNewMessage(""); 
    const targetClientId = selectedClient.user_id || selectedClient.id;

    // Optimistic UI
    const tempMsg = {
      id: Date.now(),
      message: msgContent,
      sender_id: currentUser.id,
      sender_type: 'coach',
      created_date: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      // MINIMAL PAYLOAD to prevent 500 Errors
      await ChatEntity.create({
        coach_id: currentUser.id,
        client_id: targetClientId,
        sender_id: currentUser.id,
        sender_type: 'coach',
        message: msgContent
      });
    } catch (error) {
      console.error(error);
      toast.error("Message failed to send (Server Error)");
    }
  };

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 p-6 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4 bg-card border border-border rounded-xl p-4 shrink-0 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-secondary/50" 
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
                    selectedClient?.id === client.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary/80 text-foreground"
                  )}
                >
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={client.profile_image} />
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

      {/* Main Chat */}
      <div className="flex-1 flex flex-col overflow-hidden bg-card border border-border rounded-xl shadow-sm">
        {selectedClient ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3 bg-secondary/30">
               <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedClient.profile_image} />
                  <AvatarFallback>{selectedClient.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-foreground">{selectedClient.full_name}</h2>
                  <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 block"></span> Active Client</p>
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
                          {msg.message}
                          <div className={cn("text-[10px] mt-1 opacity-70", isMe ? "text-right" : "text-left")}>
                            {formatMessageTime(msg.created_date)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border bg-background">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="bg-secondary/50 border-border" />
                <Button type="submit" size="icon" disabled={!newMessage.trim()} className="shrink-0"><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="bg-secondary/50 p-6 rounded-full mb-4"><MessageSquare className="w-12 h-12 opacity-50" /></div>
            <h3 className="text-xl font-semibold text-foreground">Select a client</h3>
            <p className="text-sm">Choose from the list on the left to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 3. CLIENT VIEW ---
function ClientChatView({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.coach_id) return;
    
    const fetchMessages = async () => {
      const ChatEntity = getChatEntity();
      if (!ChatEntity) return;

      try {
        // SAFE MODE: Filter ONLY by client_id (simplest query possible)
        const allMyMessages = await ChatEntity.filter({ 
          client_id: currentUser.id 
        });

        // FRONTEND FILTER: Ensure we only show chats with OUR coach
        const relevantMessages = allMyMessages.filter(msg => 
          msg.coach_id === currentUser.coach_id
        );

        setMessages(relevantMessages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.coach_id) return;
    
    const ChatEntity = getChatEntity();
    if (!ChatEntity) return;

    const msgContent = newMessage;
    setNewMessage("");

    // Optimistic Update
    const tempMsg = {
      id: Date.now(),
      message: msgContent,
      sender_id: currentUser.id,
      sender_type: 'client',
      created_date: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await ChatEntity.create({
        coach_id: currentUser.coach_id,
        client_id: currentUser.id,
        sender_id: currentUser.id,
        sender_type: 'client',
        message: msgContent
      });
    } catch (error) {
      console.error("Failed to send", error);
      toast.error("Message failed to send");
    }
  };

  if (!currentUser?.coach_id) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <User className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground">No Coach Assigned</h2>
        <p className="text-muted-foreground mt-2">You need to be assigned to a coach before you can use the chat.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-4 mb-4 p-4 bg-card border border-border rounded-xl shadow-sm">
        <Avatar className="h-12 w-12 border border-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary font-bold">CO</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold text-foreground">Coach Chat</h1>
          <p className="text-sm text-muted-foreground">Ask questions or send updates</p>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-lg">
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="flex flex-col space-y-4">
            {messages.length === 0 ? (
               <div className="text-center text-muted-foreground py-10 opacity-50"><p>Start the conversation with your coach.</p></div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === currentUser?.id;
                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id || i} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm", isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary text-secondary-foreground rounded-bl-none")}>
                      <p>{msg.message}</p>
                      <span className={cn("text-[10px] block mt-1 opacity-70", isMe ? "text-right" : "text-left")}>
                         {formatMessageTime(msg.created_date)}
                      </span>
                    </div>
                  </motion.div>
                )
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="p-4 bg-background border-t border-border">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message your coach..." className="bg-secondary/50 border-border" />
            <Button type="submit" disabled={!newMessage.trim()}><Send className="w-4 h-4" /></Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- 3. MAIN PAGE WRAPPER ---
export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    init();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (!user) return null;

  return user.user_type === 'coach' 
    ? <CoachChatView currentUser={user} /> 
    : <ClientChatView currentUser={user} />;
}