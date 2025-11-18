import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Save, X } from "lucide-react";

export default function ExerciseCard({ exercise, index, isEditing, onUpdate, onRemove }) {
  const [isEditingExercise, setIsEditingExercise] = useState(false);
  const [editForm, setEditForm] = useState(exercise);

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditingExercise(false);
  };

  const handleCancel = () => {
    setEditForm(exercise);
    setIsEditingExercise(false);
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditingExercise ? (
              <div className="space-y-3">
                <Input
                  value={editForm.exercise_name}
                  onChange={(e) => setEditForm({...editForm, exercise_name: e.target.value})}
                  className="bg-gray-800 border-gray-700 font-medium text-lg"
                />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Sets</label>
                    <Input
                      type="number"
                      value={editForm.sets}
                      onChange={(e) => setEditForm({...editForm, sets: parseInt(e.target.value)})}
                      className="bg-gray-800 border-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Reps</label>
                    <Input
                      value={editForm.reps}
                      onChange={(e) => setEditForm({...editForm, reps: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Weight</label>
                    <Input
                      value={editForm.weight}
                      onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Rest</label>
                    <Input
                      value={editForm.rest_time}
                      onChange={(e) => setEditForm({...editForm, rest_time: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-sm"
                    />
                  </div>
                </div>

                <Textarea
                  placeholder="Notes..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-sm resize-none"
                  rows={2}
                />

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="border-gray-600 hover:bg-gray-800">
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-6 h-6 bg-yellow-500 text-black text-sm font-bold rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h4 className="font-semibold text-white text-lg">{exercise.exercise_name}</h4>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-400">Sets:</span>
                    <span className="ml-2 text-white font-medium">{exercise.sets}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reps:</span>
                    <span className="ml-2 text-white font-medium">{exercise.reps}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Weight:</span>
                    <span className="ml-2 text-white font-medium">{exercise.weight || "Bodyweight"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Rest:</span>
                    <span className="ml-2 text-white font-medium">{exercise.rest_time || "60s"}</span>
                  </div>
                </div>

                {exercise.notes && (
                  <p className="text-gray-400 text-sm italic mb-3">{exercise.notes}</p>
                )}

                {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscle_groups.map((muscle, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing && !isEditingExercise && (
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingExercise(true)}
                className="text-gray-400 hover:text-white"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="text-gray-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}