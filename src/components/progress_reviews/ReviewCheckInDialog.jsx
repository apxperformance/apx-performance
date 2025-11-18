import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format, setHours, setMinutes } from 'date-fns';
import { MessageSquare, Calendar, Clock, Pill, Dumbbell, Utensils, User, ExternalLink, CheckCircle2, XCircle, MessageCircle, History, Image, CalendarIcon } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SupplementComplianceHistory from "../supplements/SupplementComplianceHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReviewCheckInDialog({ 
  isOpen, 
  onClose, 
  checkIn, 
  clientContext,
  compliance,
  onProvideFeedback, 
  onScheduleReview,
  onOpenPhotoGallery,
  onViewHistory,
  onMessageClient
}) {
  const [feedback, setFeedback] = useState("");
  const [scheduleTime, setScheduleTime] = useState(format(setMinutes(setHours(new Date(), 9), 0), "yyyy-MM-dd'T'HH:mm"));
  const [complianceHistory, setComplianceHistory] = useState([]);
  const [loadingCompliance, setLoadingCompliance] = useState(false);

  // Load compliance history when dialog opens
  useEffect(() => {
    const loadComplianceHistory = async () => {
      if (!checkIn || !clientContext?.client || !clientContext?.supplementPlan || !isOpen) return;
      
      setLoadingCompliance(true);
      try {
        const history = await base44.entities.SupplementCompliance.filter({
          client_id: clientContext.client.id,
          supplement_plan_id: clientContext.supplementPlan.id
        }, "-date");
        setComplianceHistory(history);
      } catch (error) {
        console.error("Error loading compliance history:", error);
        setComplianceHistory([]);
      }
      setLoadingCompliance(false);
    };

    loadComplianceHistory();
  }, [isOpen, checkIn, clientContext]);

  if (!checkIn || !clientContext?.client) return null;

  const { client, workouts, nutritionPlan, supplementPlan } = clientContext;

  const handleFeedbackSubmit = () => {
    if (feedback.trim()) {
      onProvideFeedback(checkIn.id, feedback);
    }
  };

  const handleScheduleSubmit = () => {
    onScheduleReview(checkIn, scheduleTime);
  };

  const handleAcknowledge = () => {
    onProvideFeedback(checkIn.id, "Check-in acknowledged - keep up the great work!");
  };
  
  const compliancePercentage = compliance && supplementPlan && supplementPlan.supplements && supplementPlan.supplements.length > 0 ? 
    Math.round((compliance.supplements_taken.length / supplementPlan.supplements.length) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Review Check-in: {client.full_name}</DialogTitle>
              <DialogDescription>
                Submitted on {format(new Date(checkIn.created_date), 'MMM d, yyyy')}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onMessageClient()}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Client
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewHistory()}
              >
                <History className="w-4 h-4 mr-2" />
                View History
              </Button>
              <Link to={`${createPageUrl("ClientProfile")}?clientId=${client.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Full Profile
                </Button>
              </Link>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="checkin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checkin">Check-in Data</TabsTrigger>
            <TabsTrigger value="supplements">Supplement Compliance</TabsTrigger>
            <TabsTrigger value="context">Client Context</TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="space-y-6 mt-6">
            {/* Check-in Metrics */}
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Check-in Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-card rounded-lg">
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="text-xl font-bold text-foreground">{checkIn.weight} lbs</p>
                  </div>
                  <div className="p-3 bg-card rounded-lg">
                    <p className="text-sm text-muted-foreground">Energy</p>
                    <p className="text-xl font-bold text-foreground">{checkIn.energy_level}/10</p>
                  </div>
                  <div className="p-3 bg-card rounded-lg">
                    <p className="text-sm text-muted-foreground">Sleep</p>
                    <p className="text-xl font-bold text-foreground">{checkIn.sleep_hours}h</p>
                  </div>
                  <div className="p-3 bg-card rounded-lg">
                    <p className="text-sm text-muted-foreground">Stress</p>
                    <p className="text-xl font-bold text-foreground">{checkIn.stress_level}/10</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {checkIn.notes && (
              <Card className="bg-secondary/50 border-border">
                <CardContent className="p-4">
                  <Label className="text-foreground font-semibold mb-2 block">Client Notes</Label>
                  <p className="text-muted-foreground italic bg-card p-3 rounded-md">"{checkIn.notes}"</p>
                </CardContent>
              </Card>
            )}

            {checkIn.progress_photos && checkIn.progress_photos.length > 0 && (
              <Card className="bg-secondary/50 border-border">
                <CardContent className="p-4">
                  <Label className="text-foreground font-semibold mb-2 block">Progress Photos</Label>
                  <div className="flex gap-2 flex-wrap">
                    {checkIn.progress_photos.map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => onOpenPhotoGallery(checkIn.progress_photos, i)}
                        className="block cursor-pointer"
                      >
                        <img 
                          src={photo} 
                          alt={`Progress ${i + 1}`} 
                          className="w-24 h-24 object-cover rounded-md hover:scale-105 hover:ring-2 hover:ring-[#C5B358] transition-all" 
                        />
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPhotoGallery(checkIn.progress_photos, 0)}
                    className="mt-3 w-full border-border hover:bg-secondary"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    View in Gallery
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Provide Feedback Section */}
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Provide Feedback
                </h3>
                <Textarea
                  placeholder="Write your feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="bg-input border-border text-foreground resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedback.trim()}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    Send Feedback
                  </Button>
                  <Button
                    onClick={handleAcknowledge}
                    variant="outline"
                    className="border-border hover:bg-secondary"
                  >
                    Quick Acknowledge
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Schedule for Later */}
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule for Later
                </h3>
                <p className="text-sm text-muted-foreground">Block time to review this check-in in detail.</p>
                <div>
                  <Label htmlFor="scheduleTime">Review Date & Time</Label>
                  <Input 
                    id="scheduleTime"
                    type="datetime-local" 
                    value={scheduleTime} 
                    onChange={(e) => setScheduleTime(e.target.value)} 
                    className="bg-input border-border mt-2" 
                  />
                </div>
                <Button
                  onClick={handleScheduleSubmit}
                  variant="outline"
                  className="w-full border-border hover:bg-secondary"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplements" className="space-y-6 mt-6">
            {supplementPlan ? (
              <>
                {/* Today's Compliance Overview */}
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Pill className="w-5 h-5 text-purple-500" />
                      Today's Supplement Compliance
                    </h4>
                    
                    {compliance ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Adherence</span>
                          <Badge className={compliancePercentage === 100 ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" : "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30"}>
                            {compliancePercentage}%
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div 
                              className={`h-full rounded-full transition-all ${compliancePercentage === 100 ? 'bg-[hsl(var(--success))]' : 'bg-purple-500'}`}
                              style={{ width: `${compliancePercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-foreground">{compliance.supplements_taken.length}/{supplementPlan.supplements.length}</span>
                        </div>
                        
                        <div className="space-y-1 mt-3">
                          {supplementPlan.supplements.map((supp, idx) => {
                            const taken = compliance.supplements_taken.includes(supp.name);
                            return (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                {taken ? (
                                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className={taken ? "text-foreground" : "text-muted-foreground"}>
                                  {supp.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {compliance.notes && (
                          <p className="text-xs text-muted-foreground italic mt-2">"{compliance.notes}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        <p>Client has not logged supplement compliance for this date.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Historical Compliance */}
                {loadingCompliance ? (
                  <Card className="bg-card/50 backdrop-blur-xl border-border">
                    <CardContent className="p-8 text-center">
                      <div className="w-12 h-12 border-4 border-[#C5B358] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading compliance history...</p>
                    </CardContent>
                  </Card>
                ) : complianceHistory.length > 0 ? (
                  <SupplementComplianceHistory 
                    complianceRecords={complianceHistory}
                    supplementPlan={supplementPlan}
                  />
                ) : (
                  <Card className="bg-card/50 backdrop-blur-xl border-border">
                    <CardContent className="p-8 text-center">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                      <p className="text-muted-foreground">No compliance history available yet</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="bg-card/50 backdrop-blur-xl border-border">
                <CardContent className="p-8 text-center">
                  <Pill className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground">No supplement plan assigned to this client.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="context" className="space-y-4 mt-6">
            <h3 className="font-semibold text-lg text-foreground">Client Context</h3>
            
            {/* Workouts */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Workouts</h4>
                </div>
                {workouts && workouts.length > 0 ? (
                  <div className="space-y-2">
                    {workouts.slice(0, 3).map((workout) => (
                      <div key={workout.id} className="text-sm">
                        <p className="font-medium text-foreground">{workout.name}</p>
                        <p className="text-xs text-muted-foreground">{workout.difficulty_level} • {workout.estimated_duration}min</p>
                      </div>
                    ))}
                    {workouts.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{workouts.length - 3} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No workouts assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Nutrition */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground">Nutrition</h4>
                </div>
                {nutritionPlan ? (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground text-sm">{nutritionPlan.name}</p>
                    <p className="text-xl font-bold text-primary">{nutritionPlan.daily_calories} cal</p>
                    {nutritionPlan.macros && (
                      <div className="grid grid-cols-3 gap-1 text-xs text-center mt-2">
                        <div>
                          <div className="font-semibold text-foreground">{nutritionPlan.macros.protein_grams}g</div>
                          <div className="text-muted-foreground">Protein</div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{nutritionPlan.macros.carbs_grams}g</div>
                          <div className="text-muted-foreground">Carbs</div>
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{nutritionPlan.macros.fat_grams}g</div>
                          <div className="text-muted-foreground">Fat</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No nutrition plan assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Supplements */}
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-4 h-4 text-purple-500" />
                  <h4 className="font-semibold text-foreground">Supplements</h4>
                </div>
                {supplementPlan ? (
                  <div className="space-y-2">
                    <p className="font-medium text-foreground text-sm">{supplementPlan.name}</p>
                    <p className="text-sm text-muted-foreground">{supplementPlan.supplements?.length || 0} supplements</p>
                    {supplementPlan.supplements && supplementPlan.supplements.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {supplementPlan.supplements.slice(0, 3).map((supp, idx) => (
                          <div key={idx} className="text-xs">
                            <p className="font-medium text-foreground">{supp.name}</p>
                            <p className="text-muted-foreground">{supp.dosage}</p>
                          </div>
                        ))}
                        {supplementPlan.supplements.length > 3 && (
                          <p className="text-xs text-muted-foreground">+{supplementPlan.supplements.length - 3} more</p>
                        )}
                      </div>
                    )}
                    <Link to={`${createPageUrl("SupplementPlanner")}?planId=${supplementPlan.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        View Full Plan
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No supplement plan assigned</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}