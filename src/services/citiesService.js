import { supabase } from "../config/database.js";

export class CitiesService {
  // Получить все города
  static async getAllCities() {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  }

  // Получить город по ID
  static async getCityById(cityId) {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("id", cityId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching city:", error);
      return null;
    }
  }
}

