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
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  console.log("Profiles:", profiles);
  console.log("Error:", error);
}

run();
