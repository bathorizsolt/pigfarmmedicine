const SUPABASE_URL = 'https://zjhsypraktznwwpzznlr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaHN5cHJha3R6bnd3cHp6bmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNzc2ODksImV4cCI6MjA2MTk1MzY4OX0.AcH8SmsGIhx8MXnPWvbTBBn56kiOGTxljeAdEY-iCSc';

let supabaseClient;

function initSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            if (typeof supabase.createClient === 'function') {
                supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                window.supabase = supabaseClient;
                console.log('Supabase client initialized successfully');
                return supabaseClient;
            } else if (typeof supabase === 'function') {
                supabaseClient = supabase(SUPABASE_URL, SUPABASE_KEY);
                window.supabase = supabaseClient;
                console.log('Supabase client initialized successfully');
                return supabaseClient;
            }
        } else if (typeof createClient === 'function') {
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
            window.supabase = supabaseClient;
            console.log('Supabase client initialized successfully');
            return supabaseClient;
        } else {
            console.error('Supabase library not found.');
            return null;
        }
    } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        return null;
    }
}

async function sendMessage() {
    if (!supabaseClient) {
        initSupabase();
        if (!supabaseClient) {
            alert('Error: Supabase client not initialized');
            return;
        }
    }

    const input = document.getElementById('messageInput');
    const text = input.value;
    if (!text) return;

    const { data, error } = await supabaseClient
        .from('messages')
        .insert([{ text }]);

    if (error) {
        alert('Hiba történt: ' + error.message);
    } else {
        input.value = '';
        loadMessages();
    }
}

async function loadMessages() {
    if (!supabaseClient) {
        initSupabase();
        if (!supabaseClient) {
            console.error('Error: Supabase client not initialized');
            return;
        }
    }

    const { data, error } = await supabaseClient
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading messages:', error);
        return;
    }

    const container = document.getElementById('messages');
    container.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(msg => {
            const div = document.createElement('div');
            div.textContent = msg.text;
            container.appendChild(div);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initSupabase();

    if (document.getElementById('messages')) {
        loadMessages();
    }

    const today = new Date().toISOString().split('T')[0];
    const givingDateEl = document.getElementById('givingDate');
    if (givingDateEl) {
        givingDateEl.value = today;
    }

    if (document.getElementById('recordsTable')) {
        loadRecords();
        updateStats();
    }

    const setupEventListeners = () => {
        const addListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        addListener('saveRecord', 'click', saveRecord);
        addListener('exportPdf', 'click', exportToPdf);
        addListener('resetDaily', 'click', resetRecords);
        addListener('showAll', 'click', () => filterRecords('all'));
        addListener('showToday', 'click', () => filterRecords('today'));
        addListener('showWeek', 'click', () => filterRecords('week'));
        addListener('showMonth', 'click', () => filterRecords('month'));
        addListener('searchRecords', 'input', searchRecords);
        addListener('logoutBtn', 'click', logout);
    };

    setupEventListeners();
    setupRegistration();
});

async function logout() {
    try {
        if (window.supabase) {
            await window.supabase.auth.signOut();
            window.location.href = 'login.html';
        } else {
            console.error("Supabase client not available");
            alert("Logout failed: Authentication service not available");
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed: ' + error.message);
    }
}

let records = [];

function saveRecord() {
    const farmNumber = document.getElementById('farmId').value;
    const barnSection = document.getElementById('barnSection').value;
    const sowNumber = document.getElementById('sowNumber').value;
    const medicine = document.getElementById('medicine').value;
    const dosage = document.getElementById('dosage').value;
    const pigCount = document.getElementById('pigCount').value;
    const givingDate = document.getElementById('givingDate').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const notes = document.getElementById('notes').value;

    if (!farmNumber || !barnSection || !medicine || !dosage || !pigCount || !givingDate || !expiryDate) {
        alert('Please fill in all required fields');
        return;
    }

    const record = {
        id: Date.now(),
        farmNumber,
        barnSection,
        sowNumber,
        medicine,
        dosage,
        pigCount,
        givingDate,
        expiryDate,
        notes,
        timestamp: new Date().toISOString()
    };

    records.push(record);

    localStorage.setItem('pigFarmMedicineRecords', JSON.stringify(records));

    document.getElementById('farmId').value = '';
    document.getElementById('barnSection').value = '';
    document.getElementById('sowNumber').value = '';
    document.getElementById('medicine').value = '';
    document.getElementById('dosage').value = '';
    document.getElementById('pigCount').value = '';
    document.getElementById('givingDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('expiryDate').value = '';
    document.getElementById('notes').value = '';

    loadRecords();
    updateStats();

    if (window.supabase) {
        saveToDatabase(record);
    }

    alert('Record saved successfully!');
}

async function saveToDatabase(record) {
  try {
    if (!window.supabase) {
      console.error('Supabase client not available');
      return;
    }

    const cleanRecord = {
      farm_id: record.farmNumber,
      barn_section: record.barnSection,
      sow_number: record.sowNumber,
      medicine: record.medicine,
      dosage: record.dosage,
      pig_count: record.pigCount,
      giving_date: record.givingDate || null,
      expiry_date: record.expiryDate || null,
      notes: record.notes,
      created_at: record.timestamp || new Date().toISOString(),
    };

    const { data, error } = await window.supabase
      .from('medicine_records')
      .insert([cleanRecord]);

    if (error) {
      console.error('Error saving to database:', error);
    } else {
      console.log('Successfully saved to database:', data);
    }
  } catch (err) {
    console.error('Exception while saving to database:', err);
  }
}



function loadRecords() {
  const storedRecords = localStorage.getItem('pigFarmMedicineRecords');
  if (storedRecords) {
      records = JSON.parse(storedRecords);
      displayRecords(records);
  } else {
      records = [];
      displayRecords([]);
  }
}

function displayRecords(recordsToDisplay) {
  const tableBody = document.getElementById('recordsTable');
  const noRecords = document.getElementById('noRecords');

  tableBody.innerHTML = '';

  if (recordsToDisplay.length === 0) {
      noRecords.style.display = 'block';
      return;
  }

  noRecords.style.display = 'none';

  recordsToDisplay.forEach(record => {
      const row = document.createElement('tr');

      row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${record.farmNumber}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.barnSection}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.sowNumber || '-'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.medicine}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.dosage} ${record.dosage.includes('ml') ? '' : 'g'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.pigCount}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(record.givingDate)}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.expiryDate ? formatDate(record.expiryDate) : '-'}</td>
          <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${record.notes || '-'}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium no-print">
              <button onclick="deleteRecord(${record.id})" class="text-red-600 hover:text-red-900 mr-2">
                  <i class="fas fa-trash"></i>
              </button>
              <button onclick="editRecord(${record.id})" class="text-indigo-600 hover:text-indigo-900">
                  <i class="fas fa-edit"></i>
              </button>
          </td>
      `;

      tableBody.appendChild(row);
  });
}

function filterRecords(period) {
  const buttons = ['showAll', 'showToday', 'showWeek', 'showMonth'];

  buttons.forEach(btn => {
      const button = document.getElementById(btn);
      if (btn === `show${period.charAt(0).toUpperCase() + period.slice(1)}` ||
          (period === 'all' && btn === 'showAll')) {
          button.classList.remove('bg-gray-100', 'text-gray-700');
          button.classList.add('bg-indigo-100', 'text-indigo-700');
      } else {
          button.classList.remove('bg-indigo-100', 'text-indigo-700');
          button.classList.add('bg-gray-100', 'text-gray-700');
      }
  });

  if (period === 'all') {
      displayRecords(records);
  } else {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      let filtered = [];

      if (period === 'today') {
          filtered = records.filter(r => r.givingDate === today);
      } else if (period === 'week') {
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          filtered = records.filter(r => new Date(r.givingDate) >= startOfWeek);
      } else if (period === 'month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = records.filter(r => new Date(r.givingDate) >= startOfMonth);
      }

      displayRecords(filtered);
  }
}

function searchRecords() {
  const searchTerm = document.getElementById('searchRecords').value.toLowerCase();

  if (!searchTerm) {
      displayRecords(records);
      return;
  }

  const filtered = records.filter(record =>
      (record.sowNumber && record.sowNumber.toLowerCase().includes(searchTerm)) ||
      record.farmNumber.toLowerCase().includes(searchTerm) ||
      record.barnSection.toLowerCase().includes(searchTerm) ||
      record.medicine.toLowerCase().includes(searchTerm) ||
      record.notes.toLowerCase().includes(searchTerm)
  );

  displayRecords(filtered);
}

function deleteRecord(id) {
  if (confirm('Are you sure you want to delete this record?')) {
      records = records.filter(record => record.id !== id);
      localStorage.setItem('pigFarmMedicineRecords', JSON.stringify(records));
      loadRecords();
      updateStats();
  }
}

function editRecord(id) {
  const record = records.find(r => r.id === id);
  if (!record) return;

  document.getElementById('farmId').value = record.farmNumber;
  document.getElementById('barnSection').value = record.barnSection;
  document.getElementById('sowNumber').value = record.sowNumber || '';
  document.getElementById('medicine').value = record.medicine;
  document.getElementById('dosage').value = record.dosage;
  document.getElementById('pigCount').value = record.pigCount;
  document.getElementById('givingDate').value = record.givingDate;
  document.getElementById('expiryDate').value = record.expiryDate || '';
  document.getElementById('notes').value = record.notes || '';

  records = records.filter(r => r.id !== id);

  document.getElementById('farmId').focus();
}

function resetRecords() {
  if (confirm('Are you sure you want to reset all records? This cannot be undone.')) {
      records = [];
      localStorage.setItem('pigFarmMedicineRecords', JSON.stringify(records));
      loadRecords();
      updateStats();
      alert('All records have been cleared.');
  }
}

function updateStats() {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayCount = records.filter(r => r.givingDate === today).length;
  const weekCount = records.filter(r => new Date(r.givingDate) >= startOfWeek).length;
  const monthCount = records.filter(r => new Date(r.givingDate) >= startOfMonth).length;

  document.getElementById('todayCount').textContent = todayCount;
  document.getElementById('weekCount').textContent = weekCount;
  document.getElementById('monthCount').textContent = monthCount;

  const recentMedicines = [...new Set(records.slice(-10).map(r => r.medicine))].slice(0, 5);
  const recentContainer = document.getElementById('recentMedicines');
  recentContainer.innerHTML = '';

  if (recentMedicines.length === 0) {
      recentContainer.innerHTML = '<span class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">No recent medicines</span>';
  } else {
      recentMedicines.forEach(med => {
          const span = document.createElement('span');
          span.className = 'text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded';
          span.textContent = med;
          recentContainer.appendChild(span);
      });
  }

  const upcomingExpirations = records
      .filter(r => r.expiryDate)
      .filter(r => {
          const expiry = new Date(r.expiryDate);
          const today = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(today.getDate() + 7);
          return expiry >= today && expiry <= nextWeek;
      })
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      .slice(0, 3);

  const expContainer = document.getElementById('upcomingExpirations');
  expContainer.innerHTML = '';

  if (upcomingExpirations.length === 0) {
      expContainer.innerHTML = '<div class="text-sm text-gray-500">No upcoming expirations</div>';
  } else {
      upcomingExpirations.forEach(record => {
          const div = document.createElement('div');
          div.className = 'text-sm';
          div.innerHTML = `
              <span class="font-medium">${record.medicine}</span>
              <span class="text-gray-500">expires ${formatDate(record.expiryDate)}</span>
          `;
          expContainer.appendChild(div);
      });
  }
}

function exportToPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Pig Farm Medicine Records', 14, 22);

  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  const headers = [
      'Farm #',
      'Barn/Section',
      'Sow #',
      'Medicine',
      'Dosage',
      'Pigs',
      'Given On',
      'Expires',
      'Notes'
  ];

  const data = records.map(record => [
      record.farmNumber,
      record.barnSection,
      record.sowNumber || '-',
      record.medicine,
      `${record.dosage} ${record.dosage.includes('ml') ? '' : 'g'}`,
      record.pigCount,
      formatDate(record.givingDate),
      record.expiryDate ? formatDate(record.expiryDate) : '-',
      record.notes || '-'
  ]);

  doc.autoTable({
      head: [headers],
      body: data,
      startY: 35,
      styles: {
          fontSize: 8,
          cellPadding: 1
      },
      headStyles: {
          fillColor: [79, 70, 229]
      }
  });

  doc.save('pig-farm-medicine-records.pdf');
}

function formatDate(dateString) {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function setupLogin() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const farmId = document.getElementById('farmId').value.trim();
      const password = document.getElementById('password').value;

      if (!window.supabase) {
        initSupabase();
        if (!window.supabase) {
          document.getElementById('errorMessage').textContent = 'Authentication service not available';
          return;
        }
      }

      const { data, error } = await window.supabase
        .from('login')
        .select('*')
        .eq('farm_id', farmId)
        .eq('password', password)
        .single();

      if (error || !data) {
        document.getElementById('errorMessage').textContent = 'Hibás farm ID vagy jelszó!';
      } else {
        localStorage.setItem('farmId', data.farm_id);
        window.location.href = 'register.html';
      }
    });
  }
}

function setupRegistration() {
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          const errorMessage = document.getElementById('errorMessage');
          const successMessage = document.getElementById('successMessage');
          errorMessage.textContent = '';
          successMessage.textContent = '';

          const farmId = document.getElementById('farmId').value.trim();
          const email = document.getElementById('email').value.trim();
          const password = document.getElementById('password').value;

          if (!farmId || !email || !password) {
              errorMessage.textContent = 'Please fill in all fields';
              return;
          }

          try {
              const { data: authData, error: authError } = await window.supabase.auth.signUp({
                  email: email,
                  password: password,
              });

              if (authError) {
                  errorMessage.textContent = `Authentication error: ${authError.message}`;
                  return;
              }

              const { error: farmError } = await window.supabase
                  .from('farms')
                  .insert([{
                      farm_id: farmId,
                      user_id: authData.user.id,
                      email: email
                  }]);

              if (farmError) {
                  errorMessage.textContent = `Error saving farm data: ${farmError.message}`;
                  return;
              }

              successMessage.textContent = 'Registration successful! Please check your email to confirm your account.';

              document.getElementById('registerForm').reset();

              setTimeout(() => {
                  window.location.href = 'login.html';
              }, 3000);

          } catch (err) {
              errorMessage.textContent = `Unexpected error: ${err.message}`;
          }
      });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof createClient === 'function') {
      initSupabase();
  } else {
      window.addEventListener('supabaseLoaded', initSupabase);
  }

  setupRegistration();
  setupLogin();
});