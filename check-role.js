import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rrzbldrqalwxbmbnytyp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WBdfDETSqy8i5BXCv23AEQ_vBZstfxd";

function createSupabaseFetch(supabaseKey) {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (supabaseKey.startsWith('sb_publishable_') && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
  }
});

async function run() {
  const email = "ratanprajapti1242@gmail.com";
  const password = "Google@123456@";

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Auth Error:", error.message);
    return;
  }

  const user = data.user;
  console.log("Logged in as user:", user.id);

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", user.id);

  console.log("Roles for user:", roleData, roleError);
}

run();
