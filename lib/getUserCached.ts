import { supabase } from "@/lib/supabase";

let cachedUser: any = null;

export const getUserCached = async () => {
  if (cachedUser) return cachedUser;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  cachedUser = user;
  return user;
};