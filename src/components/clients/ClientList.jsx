import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Calendar, Search, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from 'date-fns'; // Import format from date-fns
import { toast } from "sonner";

import StatusBadge from "../ui/status-badge";

export default function ClientList({ clients, isLoading, onClientUpdate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteClient = async (e, client) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to remove ${client.full_name} as a client?`)) {
      return;
    }

    setDeletingId(client.id);
    try {
      // Delete the Client record
      await base44.entities.Client.delete(client.id);
      
      // Clear coach_id from User record if user_id exists
      if (client.user_id) {
        await base44.entities.User.update(client.user_id, { coach_id: null });
      }
      
      toast.success(`${client.full_name} has been removed from your roster.`);
      onClientUpdate();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to remove client");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter clients based on search and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Input
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-input border-border focus:border-[#C5B358] pr-10" />

          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        
        <div className="flex gap-2">
          {['all', 'active', 'pending_invitation', 'inactive'].map((status) =>
          <Button
            key={status}
            variant={statusFilter === status ? "default" : "outline"}
            onClick={() => setStatusFilter(status)} className="bg-gray-800 text-gray-50 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 hover:bg-[#A4913C]"





            size="sm">

              {status === 'all' ? 'All' : status === 'pending_invitation' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )}
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ?
        Array(6).fill(0).map((_, i) =>
        <Card key={i} className="bg-card/50 backdrop-blur-xl border-border animate-pulse">
              <CardContent className="p-6">
                <div className="h-32"></div>
              </CardContent>
            </Card>
        ) :
        filteredClients.length > 0 ?
        filteredClients.map((client, index) =>
        <motion.div
          key={client.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}>

              <Link to={`${createPageUrl("ClientProfile")}?clientId=${client.id}`}>
                <Card className="bg-card/50 backdrop-blur-xl border-border hover:border-[#C5B358]/30 transition-all duration-300 cursor-pointer group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-gray-600 text-slate-100 rounded-full w-12 h-12 from-[#C5B358] to-[#A4913C] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <User className="bg-gray-600 text-gray-50 lucide lucide-user w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={client.status} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteClient(e, client)}
                          disabled={deletingId === client.id}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1 h-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-foreground group-hover:text-[#C5B358] transition-colors duration-300 mb-2">
                      {client.full_name}
                    </h3>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      
                      {client.phone &&
                  <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                  }

                      {/* ✅ Show last check-in if available */}
                      {client.last_checkin ?
                  <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Last check-in: {format(new Date(client.last_checkin), 'MMM d')}</span>
                        </div> :
                  client.join_date &&
                  <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(client.join_date).toLocaleDateString()}</span>
                        </div>
                  }
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
        ) :

        <div className="col-span-full">
            <Card className="bg-card/50 backdrop-blur-xl border-border">
              <CardContent className="p-12 text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Clients Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" ?
                "Try adjusting your search or filter criteria." :
                "Start by inviting your first client."}
                </p>
              </CardContent>
            </Card>
          </div>
        }
      </div>
    </div>);

}