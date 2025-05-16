import { supabase } from "./supabaseClient";

export async function getUserCharacterUsage(): Promise<number> {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user.user) {
      console.error("No authenticated user found");
      return 0;
    }
    const { data, error } = await supabase
      .from("user_usage")
      .select("chars_used")
      .eq("user_id", user.user.id)
      .single();
    if (error) {
      console.error("Error fetching user usage:", error);
      if (error.code === "PGRST116") {
        console.log("No usage record found, creating one...");
        const { error: insertError } = await supabase
          .from("user_usage")
          .insert({
            user_id: user.user.id,
            chars_used: 0,
            last_updated: new Date().toISOString()
          });
        if (insertError) {
          console.error("Error creating user usage record:", insertError);
        } else {
          console.log("Created new usage record for user");
        }
        return 0;
      }
      return 0;
    }
    return data?.chars_used || 0;
  } catch (error) {
    console.error("Error in getUserCharacterUsage:", error);
    return 0;
  }
}

export async function updateUserCharacterUsage(charsUsed: number): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error("No authenticated user found");
      return false;
    }
    const { data, error } = await supabase
      .from("user_usage")
      .update({ 
        chars_used: charsUsed,
        last_updated: new Date().toISOString()
      })
      .eq("user_id", user.user.id);
    if (error) {
      if (error.code === "23505") {
        console.log("Record already exists, but update failed");
        return false;
      }
      const { error: insertError } = await supabase
        .from("user_usage")
        .insert({
          user_id: user.user.id,
          chars_used: charsUsed,
          last_updated: new Date().toISOString()
        });
      if (insertError) {
        console.error("Error inserting user usage:", insertError);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error in updateUserCharacterUsage:", error);
    return false;
  }
}

export async function hasExceededCharacterLimit(limit = 2_500): Promise<boolean> {
  const usage = await getUserCharacterUsage();
  return usage >= limit;
}

export async function trackCharacterUsage(previousText: string, newText: string): Promise<boolean> {
  try {
    const charDifference = Math.max(0, newText.length - previousText.length);
    if (charDifference <= 0) {
      return true;
    }
    const currentUsage = await getUserCharacterUsage();
    const newUsage = currentUsage + charDifference;
    const success = await updateUserCharacterUsage(newUsage);
    return success;
  } catch (error) {
    console.error("Error in trackCharacterUsage:", error);
    return false;
  }
}