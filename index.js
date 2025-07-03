// noinspection SpellCheckingInspection

const supabaseUrl = 'https://qetcttwggszpgagwqdgl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFldGN0dHdnZ3N6cGdhZ3dxZGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODM5OTIsImV4cCI6MjA2Njk1OTk5Mn0.vbnom9gvysatVrokV6nWBHDtuac7wntkHkTA51__CBE';
// noinspection JSUnresolvedReference
const client = supabase.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase.auth.token',
  }
});

// noinspection JSUnresolvedReference
const {Grid, html} = gridjs;
let gridInstance = null;
const columnNameMap = {
  'ID': 'id',
  'Verein': 'member_club',
  'Name': 'name',
  'Email': 'email',
  'Password': 'password',
  'Kreditkarte': 'creditcard',
  'Kreditkartennummer': 'creditcard_number',
  'Monat': 'creditcard_month',
  'Jahr': 'creditcard_year',
  'CSV': 'creditcard_csv',
  'Bank': 'bank',
  'IBAN': 'bank_iban',
  'Aktiv': 'active_member',
  'Kind': 'child',
  'Eltern Name': 'parent_name',
};

async function checkAuth() {
  // noinspection JSUnresolvedReference
  const { data: { user }, error: authError } = await client.auth.getUser();

  if (authError || !user) {
    const loginBtn = document.getElementById('goToLogin');
    if (loginBtn) loginBtn.style.display = 'block';
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) logoutBtn.style.display = 'none';
  } else {
    await handleUserSession(user);
  }

  // noinspection JSUnresolvedReference
  client.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
      await handleUserSession(session.user);
    } else {
      const loginBtn = document.getElementById('goToLogin');
      if (loginBtn) loginBtn.style.display = 'block';
      const logoutBtn = document.getElementById('logout');
      if (logoutBtn) logoutBtn.style.display = 'none';

      const list = document.getElementById('memberList');
      if (list) list.innerHTML = '';
    }
  });
}

async function handleUserSession(user) {
  const content = document.getElementById("content");
  content.style.display = "flex";
  try {
    // noinspection JSUnresolvedReference
    const { data: userData, error: userError } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError);
      return;
    }

    if (!userData || !userData.role) {
      console.error('Missing or invalid role in user data:', userData);
      return;
    }

    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) logoutBtn.style.display = 'block';

    const loginBtn = document.getElementById('goToLogin');
    if (loginBtn) loginBtn.style.display = 'none';

    if (userData.role === 'postgres') {
      await getMembers();
    } else {
      const list = document.getElementById('memberList');
      if (list) {
        list.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = `No access to data for role: ${userData.role}`;
        list.appendChild(span);
      }
      console.log('No access to data for role:', userData.role);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function getMembers() {
  // noinspection JSUnresolvedReference
  const {data, error} = await client
    .from('members')
    .select('*');

  const list = document.getElementById('memberList');
  const span = document.createElement('span');
  if (error) {
    span.textContent = `${error.message}`;
    list.appendChild(span);
    console.error('Fehler beim Abrufen:', error.message);
  } else {
    const tableData = [];
    // noinspection JSUnresolvedReference
    const clubs = [...new Set(data.map(m => m.member_club))];

    clubs.forEach(club => {
      tableData.push([
        "", html(`<strong>${club}</strong>`), "", "", "", "", "", "", "", "", "", ""
      ]);

      // noinspection JSUnresolvedReference
      const parents = data.filter(m => m.member_club === club && !m.child && !m.parent_name);
      parents.forEach(parent => {
        // noinspection JSUnresolvedReference
        tableData.push([
          parent.id,
          html(`<span class="child-row">↳</span>`),
          parent.name,
          parent.email,
          parent.password,
          parent.creditcard,
          parent.creditcard_number,
          parent.creditcard_month,
          parent.creditcard_year,
          parent.creditcard_csv,
          parent.creditcard_name,
          parent.active_member ? "✅" : "❌"
        ]);

        // noinspection JSUnresolvedReference
        const childs = data.filter(m => m.child && m.parent_name === parent.name && m.member_club === club);
        childs.forEach(child => {
          // noinspection JSUnresolvedReference
          tableData.push([
            child.id,
            '',
            html(`<span class="child-row">↳ ${child.name}</span>`),
            child.email,
            child.password,
            child.creditcard,
            child.creditcard_number,
            child.creditcard_month,
            child.creditcard_year,
            child.creditcard_csv,
            child.creditcard_name,
            child.active_member ? "✅" : "❌"
          ]);
        });
      });
    });

    await loadData(tableData);
  }
}

async function loadData(tableData) {
  const wrapper = document.getElementById("wrapper");

  if (gridInstance) {
    gridInstance.destroy();
    wrapper.innerHTML = "";
  }

  gridInstance = new Grid({
    columns: [
      {
        name: 'ID',
        hidden: true
      },
      "Verein",
      {
        name: "Name",
        attributes: {
          "contenteditable": "true"
        }
      },
      "Email",
      "Password",
      "Kreditkarte",
      "Kreditkartennummer",
      "Monat",
      "Jahr",
      "CSV",
      {
        name:
          "Kreditkartenname",
        hidden: true
      },
      "Mitglied",
    ],
    style: {
      table: {
        'white-space': 'nowrap'
      }
    },
    data: () => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(tableData)
        }, 2000);
      });
    },
    pagination: {
      enabled: true,
      limit: 10,
      summary: false
    },
    sort: false,
    search: false,
    resizable: true,
  }).render(wrapper);
  const button = document.createElement('button');
  button.classList.add("open__modal__btn");
  button.innerText = 'Neues Mitglied hinzufügen';
  button.onclick = async () => {
    await initModal();
  };
  wrapper.appendChild(button)
}

async function logout() {
  // noinspection JSUnresolvedReference
  await client.auth.signOut();
  window.location.href = 'login/login.html';
}

function goToLogin() {
  window.location.href = 'login/login.html';
}

async function initModal() {
  // noinspection JSUnresolvedReference,JSUnusedGlobalSymbols
  MicroModal.show('modal-new-entry', {
    onShow: modal => console.info(`${modal.id} is shown`),
    onClose: async modal => {
      console.log(`Modal ${modal.id} closed, refreshing table...`);
      await getMembers();
    },
    openTrigger: 'data-micromodal-open',
    closeTrigger: 'data-micromodal-close',
    openClass: 'is-open',
    disableScroll: true,
    disableFocus: false,
    awaitOpenAnimation: false,
    awaitCloseAnimation: false,
    debugMode: false
  });

}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth().then(() => {
  });

  document.getElementById("wrapper").addEventListener("click", function (e) {
    const cellEditable = e.target.closest('td[contenteditable="true"]');
    if (cellEditable) return;

    const cell = e.target.closest("td");
    if (!cell) return;

    if (cell.querySelector('input, textarea')) {
      return;
    }

    const text = cell.innerText.trim();
    if (text !== '' && !text.startsWith('↳')) {
      navigator.clipboard.writeText(text)
        .then(() => {
          cell.style.backgroundColor = 'var(--accent)';
          cell.style.color = 'var(--bg)';
          setTimeout(() => {
            cell.style.backgroundColor = "";
            cell.style.color = "";
          }, 300);
        })
        .catch(err => {
          console.error("Kopieren fehlgeschlagen", err);
        });
    }
  });

  document.getElementById('wrapper').addEventListener('focusout', async (e) => {
    const cell = e.target.closest('td[contenteditable="true"]');
    if (!cell) return;

    let newValue = cell.innerText.trim();
    if (newValue.startsWith('↳')) {
      newValue = newValue.replace(/^↳\s*/, '');
    }
    const row = cell.closest('tr');
    const id = row.querySelector('td').innerText.trim();
    const visibleColumnName = cell.dataset.columnId;
    const dbColumnName = resolveDbColumnName(visibleColumnName);

    let oldName = null;
    if (dbColumnName === 'name') {
      // noinspection JSUnresolvedReference
      const {data, error} = await client
        .from('members')
        .select('name')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Alten Namen nicht geladen: ' + error.message);
        return;
      }
      oldName = data.name;
    }

    const updateObj = {};
    updateObj[dbColumnName] = newValue;

    const {error: errorParent} = await client
      .from('members')
      .update(updateObj)
      .eq('id', id);

    if (errorParent) {
      console.error('Update fehlgeschlagen: ' + errorParent.message);
      return;
    }

    console.log('Update erfolgreich');

    if (dbColumnName === 'name' && oldName !== null) {
      const {error: errorChildren} = await client
        .from('members')
        .update({parent_name: newValue})
        .eq('parent_name', oldName);

      if (errorChildren) {
        console.error('Update der Kinder fehlgeschlagen: ' + errorChildren.message);
      } else {
        console.log('Kinder erfolgreich aktualisiert');
      }
    }
  });

  document.getElementById('add-entry').addEventListener('click', async () => {
    const newEntry = {};

    // noinspection JSUnusedLocalSymbols
    for (const [visibleName, dbCol] of Object.entries(columnNameMap)) {
      let val;
      if (dbCol === 'active_member' || dbCol === 'child') {
        val = document.getElementById('input-' + dbCol).checked ? 'true' : 'false';
      } else {
        const input = document.getElementById('input-' + dbCol);
        val = input ? input.value.trim() : null;
      }

      if (val !== null && val !== '') {
        newEntry[dbCol] = val;
      }
    }

    // noinspection JSUnresolvedReference,JSUnusedLocalSymbols
    const {data, error} = await client
      .from('members')
      .insert([newEntry])
      .select()
      .single();

    if (error) {
      if (error.message.startsWith('duplicate key value violates unique')) {
        // noinspection JSUnresolvedReference
        MicroModal.close('modal-new-entry');
        return;
      }
      alert('Fehler beim Hinzufügen: ' + error.message);
      // noinspection JSUnresolvedReference
      MicroModal.close('modal-new-entry');
      return;
    }

    // noinspection JSUnresolvedReference
    MicroModal.close('modal-new-entry');
  });

  function resolveDbColumnName(visibleName) {
    return columnNameMap[visibleName] || visibleName.toLowerCase();
  }
});

