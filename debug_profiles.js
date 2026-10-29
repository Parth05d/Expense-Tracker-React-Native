const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""
);

async function test() {
  console.log("Fetching group members with profiles join...");
  const { data: gm, error: gmError } = await supabase.from('group_members').select('*, profiles(*)');
  console.log("GROUP MEMBERS:", JSON.stringify(gm, null, 2));
  console.log("GROUP MEMBERS ERROR:", gmError);
}

test();
