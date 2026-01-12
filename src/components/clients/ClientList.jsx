
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, Calendar, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from 'date-fns'; // Import format from date-fns

import StatusBadge from "../ui/status-badge";

export default function ClientList({ clients, isLoading, onClientUpdate }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
            onClick={() => setStatusFilter(status)}
            className={
            statusFilter === status ?
            "bg-[#C5B358] hover:bg-[#A4913C] text-black" :
            "border-border text-foreground hover:bg-secondary"
            }
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
                      <StatusBadge status={client.status} />
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