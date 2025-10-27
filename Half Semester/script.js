const STORAGE_KEY = 'goalTrackerProV2';
const categories = ['academic', 'spiritual', 'financial', 'personal'];

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveData() {
  const data = {};
  categories.forEach(cat => {
    const items = [];
    document.querySelectorAll(`#${cat}List li`).forEach(li => {
      const label = li.querySelector('label').textContent;
      const checked = li.querySelector('input[type="checkbox"]').checked;
      const time = li.querySelector('.timestamp')?.textContent || '';
      const notes = li.querySelector('.goal-notes')?.value || '';
      items.push({ text: label, done: checked, time, notes });
    });
    data[cat] = items;
  });

  const timetable = [];
  document.querySelectorAll('#academicTimetable tbody tr').forEach(row => {
    const cols = row.querySelectorAll('td');
    timetable.push({ day: cols[0].textContent, subject: cols[1].textContent, time: cols[2].textContent });
  });
  data.academicTimetable = timetable;

  data.weeklyFoodBudget = document.getElementById('weeklyFoodBudget').value || '';

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateProgressBar(cat) {
  const list = document.querySelectorAll(`#${cat}List li`);
  const bar = document.getElementById(`${cat}Progress`);
  if (list.length === 0) {
    bar.style.width = '0%';
    return;
  }
  const done = [...list].filter(li => li.querySelector('input').checked).length;
  bar.style.width = `${Math.round((done / list.length) * 100)}%`;
}

function addGoal(cat) {
  const input = document.getElementById(`${cat}Input`);
  const text = input.value.trim();
  if (!text) return alert('Please enter a goal.');
  const list = document.getElementById(`${cat}List`);
  const li = createGoalItem(cat, { text, done: false, time: ` (${new Date().toLocaleString()})`, notes: '' });
  list.appendChild(li);
  input.value = '';
  updateProgressBar(cat);
  saveData();
}

function createGoalItem(cat, item) {
  const li = document.createElement('li');

  // Top row with checkbox, label, timestamp
  const top = document.createElement('div');
  top.className = 'goal-top';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = item.done;
  checkbox.addEventListener('change', () => {
    updateProgressBar(cat);
    saveData();
  });

  const label = document.createElement('label');
  label.textContent = item.text;

  const time = document.createElement('span');
  time.className = 'timestamp';
  time.textContent = item.time || ` (${new Date().toLocaleString()})`;

  top.append(checkbox, label, time);
  li.appendChild(top);

  // Notes textarea
  const notes = document.createElement('textarea');
  notes.className = 'goal-notes';
  notes.placeholder = 'Write notes about this goal...';
  notes.value = item.notes || '';
  notes.addEventListener('input', saveData);
  li.appendChild(notes);

  // Action buttons (Edit, Delete)
  const actions = document.createElement('div');
  actions.className = 'goal-actions';

  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.className = 'edit';
  editBtn.onclick = () => editGoal(label);

  const delBtn = document.createElement('button');
  delBtn.textContent = 'Delete';
  delBtn.className = 'delete';
  delBtn.onclick = () => {
    li.remove();
    updateProgressBar(cat);
    saveData();
  };

  actions.append(editBtn, delBtn);
  li.appendChild(actions);

  return li;
}

function editGoal(label) {
  const newText = prompt('Edit your goal:', label.textContent);
  if (newText !== null && newText.trim() !== '') {
    label.textContent = newText.trim();
    saveData();
  }
}

function populateList(cat, items) {
  const list = document.getElementById(`${cat}List`);
  list.innerHTML = '';
  items.forEach(item => list.appendChild(createGoalItem(cat, item)));
  updateProgressBar(cat);
}

function addTimetable() {
  const dayInput = document.getElementById('dayInput');
  const subjectInput = document.getElementById('subjectInput');
  const timeInput = document.getElementById('timeInput');

  const day = dayInput.value.trim();
  const subj = subjectInput.value.trim();
  const time = timeInput.value.trim();

  if (!day || !subj || !time) return alert('Please fill all timetable fields.');

  const row = createTimetableRow({ day, subject: subj, time });
  document.querySelector('#academicTimetable tbody').appendChild(row);

  dayInput.value = '';
  subjectInput.value = '';
  timeInput.value = '';

  saveData();
}

function createTimetableRow(entry) {
  const tr = document.createElement('tr');

  const tdDay = document.createElement('td');
  tdDay.textContent = entry.day;

  const tdSubject = document.createElement('td');
  tdSubject.textContent = entry.subject;

  const tdTime = document.createElement('td');
  tdTime.textContent = entry.time;

  const tdAction = document.createElement('td');
  const delBtn = document.createElement('button');
  delBtn.textContent = 'Delete';
  delBtn.className = 'timetable-delete';
  delBtn.onclick = () => {
    tr.remove();
    saveData();
  };

  tdAction.appendChild(delBtn);

  tr.append(tdDay, tdSubject, tdTime, tdAction);
  return tr;
}

function populateTimetable(entries) {
  const tbody = document.querySelector('#academicTimetable tbody');
  tbody.innerHTML = '';
  if (!entries || !Array.isArray(entries)) return;
  entries.forEach(entry => {
    tbody.appendChild(createTimetableRow(entry));
  });
}

function checkBudget() {
  const budgetInput = document.getElementById('weeklyFoodBudget');
  const status = document.getElementById('budgetStatus');
  const amount = parseFloat(budgetInput.value);

  if (isNaN(amount) || amount <= 0) {
    status.textContent = 'Please enter a valid budget amount.';
    status.style.color = 'red';
    return;
  }

  if (amount > 18000) {
    status.textContent = `You have exceeded the ₦18,000 food budget limit by ₦${(amount - 18000).toLocaleString()}.`;
    status.style.color = 'red';
  } else {
    status.textContent = `Good job! Your food budget of ₦${amount.toLocaleString()} is within the ₦18,000 limit.`;
    status.style.color = 'green';
  }

  saveData();
}

function exportPDF() {
  // Use jsPDF to generate a PDF with all goals and timetable
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Goal Tracker Pro Report', 105, 15, null, null, 'center');

  let y = 30;

  categories.forEach(cat => {
    const title = {
      academic: 'Academic Goals',
      spiritual: 'Spiritual & Fellowship Goals',
      financial: 'Financial Discipline',
      personal: 'Personal Care & Lifestyle'
    }[cat] || cat;

    doc.setFontSize(16);
    doc.setTextColor('#34495e');
    doc.text(title, 14, y);
    y += 8;

    const data = loadData();
    const goals = (data[cat] || []);
    if (goals.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor('#7f8c8d');
      doc.text('No goals added.', 14, y);
      y += 10;
    } else {
      goals.forEach((goal, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        const checkbox = goal.done ? '[x] ' : '[ ] ';
        doc.text(checkbox + goal.text, 14, y);
        y += 7;
        if (goal.notes && goal.notes.trim() !== '') {
          const splitNotes = doc.splitTextToSize('Notes: ' + goal.notes, 180);
          doc.setFontSize(10);
          doc.setTextColor('#555');
          doc.text(splitNotes, 16, y);
          y += splitNotes.length * 6;
          doc.setTextColor('#000');
        }
      });
      y += 5;
    }
  });

  // Timetable section
  const timetableData = loadData().academicTimetable || [];
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(16);
  doc.setTextColor('#34495e');
  doc.text('Academic Timetable', 14, y);
  y += 8;

  if (timetableData.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor('#7f8c8d');
    doc.text('No timetable entries.', 14, y);
    y += 10;
  } else {
    doc.setFontSize(12);
    timetableData.forEach(entry => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${entry.day} - ${entry.subject} - ${entry.time}`, 14, y);
      y += 7;
    });
  }

  doc.save('goal-tracker-report.pdf');
}

// Initialize inputs and event listeners
window.onload = () => {
  const data = loadData();

  categories.forEach(cat => {
    if (data[cat]) populateList(cat, data[cat]);
  });

  if (data.academicTimetable) populateTimetable(data.academicTimetable);

  if (data.weeklyFoodBudget) {
    document.getElementById('weeklyFoodBudget').value = data.weeklyFoodBudget;
    checkBudget();
  }

  document.getElementById('exportBtn').onclick = exportPDF;

  // Inputs needed for timetable add
  window.dayInput = document.getElementById('dayInput');
  window.subjectInput = document.getElementById('subjectInput');
  window.timeInput = document.getElementById('timeInput');
  window.academicTimetable = document.getElementById('academicTimetable');
};
