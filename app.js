const SUPABASE_URL = 'https://zjhsypraktznwwpzznlr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaHN5cHJha3R6bnd3cHp6bmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNzc2ODksImV4cCI6MjA2MTk1MzY4OX0.AcH8SmsGIhx8MXnPWvbTBBn56kiOGTxljeAdEY-iCSc';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value;
  if (!text) return;

  const { data, error } = await supabase
    .from('messages')
    .insert([{ text }]);

  if (error) {
    alert('Hiba történt: ' + error.message);
  } else {
    input.value = '';
    loadMessages(); // újratöltés
  }
}

async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  const container = document.getElementById('messages');
  container.innerHTML = '';
  data.forEach(msg => {
    const div = document.createElement('div');
    div.textContent = msg.text;
    container.appendChild(div);
  });
}

loadMessages();

