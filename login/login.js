const supabaseUrl = 'https://qetcttwggszpgagwqdgl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldGN0dHdnZ3N6cGdhZ3dxZGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODM5OTIsImV4cCI6MjA2Njk1OTk5Mn0.vbnom9gvysatVrokV6nWBHDtuac7wntkHkTA51__CBE';
// noinspection JSUnresolvedReference
const client = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase.auth.token',
  }
});

checkAuth().then(() => {
});

async function checkAuth() {
  // noinspection JSUnusedLocalSymbols,JSUnresolvedReference
  const {data: {user}, error} = await client.auth.getUser();
  if (!error && user) {
    window.location.href = '/index.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    // noinspection JSUnresolvedReference
    const {error} = await client.auth.signInWithPassword({email, password});

    error ? alert('Login fehlgeschlagen: ' + error.message) : window.location.href = '/durmexweb/index.html';
  });
});
