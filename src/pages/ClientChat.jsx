import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User as UserIcon, Crown, AlertCircle, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";

export default function ClientChat() {
  const [user, setUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [message, setMessage] = useState("");
  const [failedMessages, setFailedMessages] = useState(new Map()); // Track failed messages
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  // Auto-select client from URL params (for coaches)
  useEffect(() => {
    if (!user) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const clientIdFromUrl = urlParams.get('clientId');
    
    if (user.user_type === 'coach' && clientIdFromUrl && clients?.length > 0) {
      const clientFromUrl = clients.find(c => c.id === clientIdFromUrl);
      if (clientFromUrl) {
        setSelectedClient(clientFromUrl);
      }
    }
  }, [user]);

  // Fetch clients (for coaches only)
  const { data: clients = [] } = useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async () => {
      if (!user || user.user_type !== 'coach') return [];
      return base44.entities.Client.filter({ coach_id: user.id, status: 'active' });
    },
    enabled: !!user && user.user_type === 'coach',
    staleTime: 5 * 60 * 1000,
  });

  // Fetch coach info (for clients only)
  const { data: coach } = useQuery({
    queryKey: ['coach', user?.coach_id],
    queryFn: async () => {
      if (!user || user.user_type !== 'client' || !user.coach_id) return null;
      const users = await base44.entities.User.filter({ id: user.coach_id });
      return users.length > 0 ? users[0] : null;
    },
    enabled: !!user && user.user_type === 'client' && !!user.coach_id,
    staleTime: 10 * 60 * 1000,
  });

  // Determine chat partner
  const chatPartnerId = user?.user_type === 'coach' ? selectedClient?.user_id : user?.coach_id;
  const coachId = user?.user_type === 'coach' ? user.id : user?.coach_id;
  const clientId = user?.user_type === 'coach' ? selectedClient?.id : user?.id;

  const canShowChat = user?.user_type === 'coach' ? !!selectedClient : !!user?.coach_id && !!coach;

  // Fetch messages with background refetching
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', coachId, clientId],
    queryFn: async () => {
      if (!coachId || !clientId) return [];
      return base44.entities.ChatMessage.filter(
        { coach_id: coachId, client_id: clientId },
        'created_date'
      );
    },
    enabled: !!coachId && !!clientId,
    staleTime: 30 * 1000,
    refetchInterval: 5000,
  });

  // Mark messages as read when viewing
  useEffect(() => {
    if (!user || !messages || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (msg) => msg.sender_id !== user.id && !msg.is_read
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(async (msg) => {
        try {
          await base44.entities.ChatMessage.update(msg.id, { is_read: true });
        } catch (error) {
          console.error("Error marking message as read:", error);
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ['messages', coachId, clientId] });
    }
  }, [messages, user, coachId, clientId, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, failedMessages]);

  // ✅ Send message mutation with enhanced error handling
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return base44.entities.ChatMessage.create(messageData);
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ['messages', coachId, clientId] });

      const previousMessages = queryClient.getQueryData(['messages', coachId, clientId]);

      const optimisticMessage = {
        ...newMessage,
        id: `temp-${Date.now()}`,
        created_date: new Date().toISOString(),
        is_read: false,
        _status: 'sending', // ✅ Track sending status
      };

      queryClient.setQueryData(['messages', coachId, clientId], (old = []) => [
        ...old,
        optimisticMessage,
      ]);

      return { previousMessages, optimisticMessage };
    },
    onError: (err, newMessage, context) => {
      // ✅ Rollback optimistic update
      queryClient.setQueryData(['messages', coachId, clientId], context.previousMessages);
      
      // ✅ Track this as a failed message
      const failedMsg = {
        ...newMessage,
        id: `failed-${Date.now()}`,
        created_date: new Date().toISOString(),
        _status: 'failed',
        _error: err.message || 'Failed to send'
      };
      
      setFailedMessages(prev => new Map(prev).set(failedMsg.id, failedMsg));
      
      // ✅ Show detailed error toast with retry option
      toast.error("Message failed to send", {
        description: err.message || "Your message couldn't be delivered. Check your connection and try again.",
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleRetryMessage(failedMsg)
        }
      });
    },
    onSuccess: (data, variables, context) => {
      // ✅ Remove from failed messages if it was being retried
      if (context?.retryId) {
        setFailedMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(context.retryId);
          return newMap;
        });
      }
      
      toast.success("Message sent", { duration: 1500 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', coachId, clientId] });
    },
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user || !coachId || !clientId) return;

    const messageData = {
      coach_id: coachId,
      client_id: clientId,
      sender_id: user.id,
      sender_type: user.user_type,
      message: message.trim(),
      message_type: 'text',
    };

    sendMessageMutation.mutate(messageData);
    setMessage("");
  };

  // ✅ Retry failed message
  const handleRetryMessage = (failedMsg) => {
    const messageData = {
      coach_id: failedMsg.coach_id,
      client_id: failedMsg.client_id,
      sender_id: failedMsg.sender_id,
      sender_type: failedMsg.sender_type,
      message: failedMsg.message,
      message_type: failedMsg.message_type || 'text',
    };

    // Pass the failed message ID so we can remove it on success
    sendMessageMutation.mutate(messageData, {
      onMutate: () => ({ retryId: failedMsg.id })
    });
  };

  // ✅ Delete failed message
  const handleDeleteFailedMessage = (failedMsgId) => {
    setFailedMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(failedMsgId);
      return newMap;
    });
    toast.info("Failed message discarded");
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((msg) => {
      const date = new Date(msg.created_date);
      let key;
      if (isToday(date)) key = 'Today';
      else if (isYesterday(date)) key = 'Yesterday';
      else key = format(date, 'MMMM d, yyyy');

      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  // Loading state for initial user fetch
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show state for clients without a coach
  if (user?.user_type === 'client' && !user.coach_id) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Coach Chat</h1>
          </div>
          <p className="text-muted-foreground">Connect with a coach to start messaging.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No Coach Assigned</p>
              <p className="text-sm">You need to be assigned to a coach to use chat</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Coach view - no client selected
  if (user.user_type === 'coach' && !selectedClient) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-[#C5B358]" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Client Chat</h1>
          </div>
          <p className="text-muted-foreground">Select a client to start messaging.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="p-6 cursor-pointer hover:border-gray-400/50 transition-all bg-card/50 backdrop-blur-xl border-border"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">{client.full_name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{client.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Loading state while waiting for selectedClient (coach) or coach (client) data
  if (!canShowChat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const chatPartner = user.user_type === 'coach' ? selectedClient : coach;
  const chatPartnerName = chatPartner?.full_name || 'Chat';

  return (
    <div className="p-6 md:p-8 h-[calc(100vh-100px)]">
      <Card className="h-full flex flex-col bg-card/50 backdrop-blur-xl border-border">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.user_type === 'coach' && (
              <Button
                variant="ghost"
                onClick={() => setSelectedClient(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </Button>
            )}
            <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
              {user.user_type === 'coach' ? (
                <UserIcon className="w-6 h-6 text-black" />
              ) : (
                <Crown className="w-6 h-6 text-black" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{chatPartnerName}</h2>
              <p className="text-sm text-muted-foreground">
                {user.user_type === 'coach' ? 'Client' : 'Your Coach'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-6">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : Object.keys(groupedMessages).length === 0 && failedMessages.size === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground">
                      {date}
                    </span>
                  </div>
                  <AnimatePresence>
                    {msgs.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      const isOptimistic = msg.id?.toString().startsWith('temp-');
                      const isSending = msg._status === 'sending';
                      
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
                          className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`p-4 rounded-2xl ${
                                isOwn
                                  ? 'bg-gray-800 text-white'
                                  : 'bg-secondary text-foreground'
                              }`}
                            >
                              <p className="break-words">{msg.message}</p>
                            </div>
                            <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                              {formatMessageDate(msg.created_date)}
                              {isSending && ' • Sending...'}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ))}

              {/* ✅ Failed Messages Section */}
              {failedMessages.size > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <span className="px-3 py-1 bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 rounded-full text-xs text-[hsl(var(--destructive))] font-medium">
                      Failed Messages
                    </span>
                  </div>
                  <AnimatePresence>
                    {Array.from(failedMessages.values()).map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="flex justify-end mb-4"
                      >
                        <div className="max-w-[70%]">
                          <div className="p-4 rounded-2xl bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 text-foreground">
                            <div className="flex items-start gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-[hsl(var(--destructive))] flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-[hsl(var(--destructive))] font-medium">Failed to send</p>
                            </div>
                            <p className="break-words">{msg.message}</p>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryMessage(msg)}
                                disabled={sendMessageMutation.isPending}
                                className="h-7 text-xs border-[hsl(var(--destructive))]/30 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Retry
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteFailedMessage(msg.id)}
                                className="h-7 text-xs text-muted-foreground hover:text-[hsl(var(--destructive))]"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Discard
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-border">
          <div className="flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-input border-border focus:border-gray-600"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}