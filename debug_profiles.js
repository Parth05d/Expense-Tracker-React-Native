const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://hokbvlpwezgqdmneosuv.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhva2J2bHB3ZXpncWRtbmVvc3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNjc1OTYsImV4cCI6MjEwMTk0MzU5Nn0.XiXVixojHWP7qD2FJ8hE2rDUrKwG1Jwaau925czdtT4"
);

async function test() {
  console.log("Fetching group members with profiles join...");
  const { data: gm, error: gmError } = await supabase.from('group_members').select('*, profiles(*)');
  console.log("GROUP MEMBERS:", JSON.stringify(gm, null, 2));
  console.log("GROUP MEMBERS ERROR:", gmError);
}

test();
