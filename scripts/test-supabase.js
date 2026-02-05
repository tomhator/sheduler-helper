
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("Testing Supabase connection...");
    console.log("URL:", supabaseUrl);
    console.log("Key Prefix:", supabaseKey ? supabaseKey.substring(0, 10) + "..." : "MISSING");

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("❌ Link Error (Profiles):", error.message);
        } else {
            console.log("✅ Success (Profiles): Connection reachable.");
        }

        // Try auth reaching (no credentials, just check if endpoint responds)
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: 'nonexistent@example.com',
            password: 'password'
        });

        console.log("Auth Response Error (Expected Invalid Login, not 500):", authError?.message);
        if (authError?.message?.includes("Database error")) {
            console.error("❌ CRITICAL: Supabase Auth Schema Error confirmed.");
        }

    } catch (e) {
        console.error("💥 Critical Failure:", e.message);
    }
}

testConnection();
