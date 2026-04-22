import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

// ── Helpers ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name?: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  goal_weight: number;
}

export interface DailyMacros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Calcula macros base quando o Agente Nutricional ainda não rodou */
export function estimateMacros(profile: Profile): DailyMacros {
  const calories = Math.round(profile.weight_kg * 29);
  return {
    calories,
    protein_g: Math.round(profile.weight_kg * 2.2),
    carbs_g: Math.round((calories * 0.40) / 4),
    fat_g: Math.round((calories * 0.28) / 9),
  };
}

/** BMI arredondado para 1 casa */
export function calcBmi(profile: Profile): string {
  return (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1);
}
