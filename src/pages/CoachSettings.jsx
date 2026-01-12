
import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, User as UserIcon, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function CoachSettings() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    specializations: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        bio: userData.bio || "",
        specializations: userData.specializations || []
      });
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await User.updateMyUserData(formData);
      // Show success message or redirect
    } catch (error) {
      console.error("Error updating profile:", error);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-pulse">
        <div className="h-10 bg-secondary rounded w-1/3"></div>
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader><div className="h-6 bg-secondary rounded w-1/4"></div></CardHeader>
          <CardContent className="space-y-4">
            {Array(5).fill(0).map((_, i) =>
            <div key={i} className="h-10 bg-secondary rounded"></div>
            )}
          </CardContent>
        </Card>
      </div>);

  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}>

        <div className="flex items-center gap-3 mb-2">
          <Settings className="text-gray-600 lucide lucide-settings w-8 h-8" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Coach Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your profile and coaching preferences.</p>
      </motion.div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Crown className="text-gray-600 lucide lucide-crown w-5 h-5" />
              Coach Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-muted-foreground">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange} className="bg-zinc-500 text-slate-50 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-[#C5B358]" />


                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="bg-input border-border opacity-50" />

                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-muted-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange} className="bg-zinc-500 px-3 py-2 text-base rounded-md flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-[#C5B358]" />


              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-muted-foreground">Professional Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4} className="bg-zinc-500 px-3 py-2 text-base rounded-md flex min-h-[60px] w-full border shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-border focus:border-[#C5B358] resize-none"

                  placeholder="Tell your clients about your experience and coaching philosophy..." />

              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving} className="bg-gray-700 text-gray-50 px-4 py-2 text-sm font-semibold rounded-md inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 hover:bg-yellow-600">


                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <UserIcon className="text-gray-600 lucide lucide-user w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Account Type</span>
              <span className="text-[#C5B358] font-medium">Elite Coach</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Member Since</span>
              <span className="text-foreground">{new Date(user?.created_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">User ID</span>
              <span className="text-muted-foreground/50 text-sm font-mono">{user?.id}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>);

}