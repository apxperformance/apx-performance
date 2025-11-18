// Common supplements database for autocomplete
export const COMMON_SUPPLEMENTS = [
  // Proteins & Amino Acids
  "Whey Protein",
  "Casein Protein",
  "Plant Protein",
  "BCAAs",
  "EAAs",
  "L-Glutamine",
  "L-Carnitine",
  
  // Performance
  "Creatine Monohydrate",
  "Beta-Alanine",
  "Citrulline Malate",
  "Pre-Workout",
  
  // Recovery
  "Magnesium",
  "Zinc",
  "Vitamin D3",
  "Omega-3 Fish Oil",
  "Collagen",
  "Electrolytes",
  
  // Energy & Focus
  "Caffeine",
  "L-Theanine",
  "Rhodiola",
  "Ashwagandha",
  
  // Joint & Bone Health
  "Glucosamine",
  "Chondroitin",
  "MSM",
  "Calcium",
  
  // General Health
  "Multivitamin",
  "Vitamin C",
  "B-Complex",
  "Probiotics",
  "Fiber Supplement",
  "Greens Powder"
].sort();

export const DOSAGE_EXAMPLES = {
  "Whey Protein": "25-30g per serving",
  "Creatine Monohydrate": "5g daily",
  "BCAAs": "5-10g",
  "Omega-3 Fish Oil": "1-2g EPA/DHA",
  "Vitamin D3": "2000-5000 IU",
  "Magnesium": "200-400mg",
  "Beta-Alanine": "3-5g",
  "Caffeine": "100-200mg",
  "L-Glutamine": "5-10g",
  "Zinc": "15-30mg"
};

export const TIMING_OPTIONS = [
  "Morning",
  "Pre-Workout",
  "Post-Workout", 
  "With Meals",
  "Between Meals",
  "Before Bed",
  "As Needed"
];

export const DOSAGE_UNITS = ["g", "mg", "IU", "capsules", "tablets", "scoops", "ml"];

// Dosage format validation regex
export const DOSAGE_PATTERN = /^\d+(\.\d+)?\s*(g|mg|iu|IU|capsule|capsules|tablet|tablets|scoop|scoops|ml|ML)$/i;