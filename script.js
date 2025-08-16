// Fitness Tracker v0.1 script

document.addEventListener('DOMContentLoaded', () => {
  // Tab navigation logic
  const navButtons = document.querySelectorAll('nav button');
  const sections = document.querySelectorAll('.tab-content');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Show corresponding section
      const target = btn.getAttribute('data-tab');
      sections.forEach(sec => {
        if (sec.id === target) {
          sec.classList.add('active');
        } else {
          sec.classList.remove('active');
        }
      });
      // Render dynamic content when switching
      if (target === 'plan') renderPlan();
      if (target === 'workout') renderWorkout();
      if (target === 'diet') renderDiet();
      if (target === 'renpho') renderRenpho();
      if (target === 'sleep') renderSleep();
      if (target === 'summary') renderSummary();
    });
  });

  // Request notification permission and schedule a daily reminder at 9AM local time.
  // This uses the Notification API together with the service worker to trigger
  // a browser notification reminding the user to review the day’s workout plan,
  // log training and meals, and update Renpho stats. Only runs if the
  // environment supports notifications and service workers.
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        // Ensure the service worker is ready before scheduling the reminder.
        navigator.serviceWorker.ready.then(() => {
          scheduleDailyReminder();
        });
      }
    });
  }

  /**
   * Schedule a local notification at the next occurrence of 9:00 AM
   * (according to the user’s local time zone). Once the notification
   * fires, it reschedules itself for the next day so the reminder
   * repeats indefinitely. Uses setTimeout instead of setInterval to
   * compute the correct delay each day.
   */
  function scheduleDailyReminder() {
    const now = new Date();
    const target = new Date();
    // Set target to 9:00:00.000 today.
    target.setHours(9, 0, 0, 0);
    // If 9AM has already passed today, roll to the next day.
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    const timeout = target.getTime() - now.getTime();
    setTimeout(() => {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.showNotification) {
          reg.showNotification('Daily Fitness Reminder', {
            body: 'Check your workout plan, log your workout and meals, and update your Renpho stats.',
            // Notification icon intentionally omitted; the browser will choose a default icon.
            tag: 'daily-fitness-reminder'
          });
        }
        // Schedule the next day’s reminder.
        scheduleDailyReminder();
      });
    }, timeout);
  }

  // Data definitions
  const startDateStr = '2025-08-16';
  const startDate = new Date(startDateStr + 'T00:00:00');
  const weeklyPatterns = [
    {
      workoutType: 'Push (Chest/Shoulders/Triceps)',
      mainLifts: 'Bench Press 4x6-8; Incline Dumbbell Press 3x8-10; Overhead Shoulder Press 4x8-10',
      accessory: 'Lateral Raises 3x15; Rope Pushdowns 3x12-15',
      absBlock: 'Lower Abs: Hanging Knee Raises 3x12-15; Ab Rollouts 3x10-12',
      rehab: 'Calf isometric holds; Glute bridges for lower back',
      conditioning: 'Bike/Row HIIT 10 min'
    },
    {
      workoutType: 'Pull (Back/Biceps)',
      mainLifts: 'Lat Pulldown 4x8-10; Seated Cable Row 4x10; Face Pulls 3x15',
      accessory: 'Dumbbell Curls 3x12; Hammer Curls 3x12',
      absBlock: 'Upper Abs: Cable Crunch 4x15; Decline Sit-ups 3x12',
      rehab: 'Eccentric calf drops; Bird dog for lower back',
      conditioning: 'Rowing Machine 10 min'
    },
    {
      workoutType: 'Legs (Lower Body)',
      mainLifts: 'Leg Press 4x10; Bulgarian Split Squats 3x12; Romanian Deadlift 3x12',
      accessory: 'Hip Thrusts 3x12; Seated Calf Raises (light) 3x15',
      absBlock: 'Obliques: Side Plank Hip Dips 3x12/side; Russian Twists 3x20',
      rehab: 'Calf isometric holds; Glute bridges and hamstring stretches',
      conditioning: 'Elliptical LISS 20 min'
    },
    {
      workoutType: 'Core & Conditioning',
      mainLifts: 'Core circuits: Plank Variations 3x45s; Ab Wheel Rollouts 3x10; Russian Twists 3x20',
      accessory: '',
      absBlock: 'Stability: Pallof Press 3x12; Bird Dog 3x12/side',
      rehab: 'Achilles mobility drill; McGill Big 3 (Curl-up, Side Plank, Bird Dog)',
      conditioning: 'HIIT (Bike/Row) 20 min'
    },
    {
      workoutType: 'Push Variation (Chest/Shoulders/Triceps)',
      mainLifts: 'Incline Dumbbell Press 3x8; Arnold Press 3x10; Dips 3x12',
      accessory: 'Dumbbell Flyes 3x12-15; Overhead Tricep Extension 3x12',
      absBlock: 'Stability: Plank 3x60s; Pallof Press 3x12',
      rehab: 'Calf eccentric drops; Hip mobility',
      conditioning: 'Bike HIIT 15 min'
    },
    {
      workoutType: 'Pull Variation (Back/Biceps)',
      mainLifts: 'Chin-Ups 4x8; T-Bar Row 4x8; Shrugs 3x12-15',
      accessory: 'Lat Pulldown 4x10; Concentration Curls 3x12',
      absBlock: 'Lower Abs: Lying Leg Raises 4x15; Reverse Crunches 3x12',
      rehab: 'Calf isometrics; Glute bridge march',
      conditioning: 'Rowing HIIT 15 min'
    },
    {
      workoutType: 'Active Recovery / Rest',
      mainLifts: '',
      accessory: 'Light stretching and mobility',
      absBlock: 'Recovery Core: Dead Bugs 3x15; Side Plank Holds 3x30s',
      rehab: 'Calf mobility; Light foam rolling for back',
      conditioning: 'Walk/Swim/Light Cycle 20-30 min'
    }
  ];

  // Build full workout schedule.  By default we generate a full year (365 days),
  // but you can increase `scheduleDays` for longer programs.  Each day is
  // assigned a training pattern from `weeklyPatterns` based on its index.
  const scheduleDays = 365; // number of days to generate (approx one year)
  function buildSchedule() {
    const schedule = [];
    for (let i = 0; i < scheduleDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const pattern = weeklyPatterns[i % weeklyPatterns.length];
      schedule.push({
        date: date.toISOString().slice(0, 10),
        dayName: date.toLocaleDateString(undefined, { weekday: 'long' }),
        ...pattern
      });
    }
    return schedule;
  }

  const fullSchedule = buildSchedule();

  // Utilities for localStorage logs
  function getLogs(type) {
    const data = localStorage.getItem(type);
    return data ? JSON.parse(data) : {};
  }
  function writeLogs(type, logs) {
    localStorage.setItem(type, JSON.stringify(logs));
  }
  function saveLog(type, date, entry) {
    const logs = getLogs(type);
    if (!logs[date]) logs[date] = [];
    logs[date].push(entry);
    writeLogs(type, logs);
  }

  // Plan rendering
  function renderPlan() {
    const container = document.getElementById('plan');
    container.innerHTML = '';
    // Determine today's date string
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayEntry = fullSchedule.find(item => item.date === todayStr);
    // Optionally allow user to select another date
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = todayStr;
    dateInput.max = fullSchedule[fullSchedule.length - 1].date;
    dateInput.min = fullSchedule[0].date;
    dateInput.addEventListener('change', () => {
      displayPlan(dateInput.value);
    });
    container.appendChild(dateInput);
    // container for plan details
    const detailsDiv = document.createElement('div');
    container.appendChild(detailsDiv);
    function displayPlan(dateStr) {
      detailsDiv.innerHTML = '';
      const entry = fullSchedule.find(item => item.date === dateStr);
      if (!entry) {
        detailsDiv.textContent = 'No plan available for this date.';
        return;
      }
      const h2 = document.createElement('h2');
      h2.textContent = `${entry.dayName} (${entry.date}) – ${entry.workoutType}`;
      detailsDiv.appendChild(h2);
      const ul = document.createElement('ul');
      const fields = [
        { label: 'Main Lifts', value: entry.mainLifts },
        { label: 'Accessory', value: entry.accessory },
        { label: 'Abs Block', value: entry.absBlock },
        { label: 'Rehab Notes', value: entry.rehab },
        { label: 'Conditioning', value: entry.conditioning }
      ];
      fields.forEach(f => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${f.label}:</strong> ${f.value || 'None'}`;
        ul.appendChild(li);
      });
      detailsDiv.appendChild(ul);
    }
    // initial display
    displayPlan(todayStr);
  }

  // Workout tab rendering
  function renderWorkout() {
    const container = document.getElementById('workout');
    container.innerHTML = '';
    // Create form
    const form = document.createElement('form');
    const date = new Date().toISOString().slice(0, 10);
    form.innerHTML = `
      <label>Date
        <input type="date" id="w-date" value="${date}" min="${fullSchedule[0].date}" max="${fullSchedule[fullSchedule.length-1].date}" />
      </label>
      <label>Exercise Name
        <input type="text" id="w-exercise" required />
      </label>
      <label>Sets
        <input type="number" id="w-sets" min="1" />
      </label>
      <label>Reps
        <input type="number" id="w-reps" min="1" />
      </label>
      <label>Weight (kg)
        <input type="number" step="0.1" id="w-weight" min="0" />
      </label>
      <label>RPE (1–10)
        <input type="number" id="w-rpe" min="1" max="10" />
      </label>
      <label>Notes
        <input type="text" id="w-notes" />
      </label>
      <button type="submit">Save Workout</button>
    `;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const entry = {
        exercise: document.getElementById('w-exercise').value,
        sets: document.getElementById('w-sets').value,
        reps: document.getElementById('w-reps').value,
        weight: document.getElementById('w-weight').value,
        rpe: document.getElementById('w-rpe').value,
        notes: document.getElementById('w-notes').value
      };
      const dateVal = document.getElementById('w-date').value;
      saveLog('workoutLogs', dateVal, entry);
      // Clear exercise fields except date
      document.getElementById('w-exercise').value = '';
      document.getElementById('w-sets').value = '';
      document.getElementById('w-reps').value = '';
      document.getElementById('w-weight').value = '';
      document.getElementById('w-rpe').value = '';
      document.getElementById('w-notes').value = '';
      renderWorkout();
    });
    container.appendChild(form);
    // Display existing logs for selected date
    const logs = getLogs('workoutLogs');
    const dateInput = form.querySelector('#w-date');
    dateInput.addEventListener('change', () => {
      renderWorkout();
    });
    const currentDate = dateInput.value;
    const dayLogs = logs[currentDate] || [];
    if (dayLogs.length) {
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight (kg)</th><th>RPE</th><th>Notes</th></tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector('tbody');
      dayLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${log.exercise}</td><td>${log.sets}</td><td>${log.reps}</td><td>${log.weight}</td><td>${log.rpe}</td><td>${log.notes}</td>`;
        tbody.appendChild(tr);
      });
      container.appendChild(table);
    }
  }

  // Diet tab rendering
  function renderDiet() {
    const container = document.getElementById('diet');
    container.innerHTML = '';
    const form = document.createElement('form');
    const date = new Date().toISOString().slice(0, 10);
    form.innerHTML = `
      <label>Date
        <input type="date" id="d-date" value="${date}" min="${fullSchedule[0].date}" max="${fullSchedule[fullSchedule.length-1].date}" />
      </label>
      <label>Meal
        <select id="d-meal">
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Snack">Snack</option>
        </select>
      </label>
      <label>Food Item
        <input type="text" id="d-food" required />
      </label>
      <label>Calories
        <input type="number" id="d-cal" min="0" />
      </label>
      <label>Protein (g)
        <input type="number" id="d-prot" min="0" />
      </label>
      <label>Carbs (g)
        <input type="number" id="d-carbs" min="0" />
      </label>
      <label>Fats (g)
        <input type="number" id="d-fats" min="0" />
      </label>
      <label>Water Intake (L)
        <input type="number" step="0.1" id="d-water" min="0" />
      </label>
      <button type="submit">Save Meal</button>
    `;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const entry = {
        meal: document.getElementById('d-meal').value,
        food: document.getElementById('d-food').value,
        calories: document.getElementById('d-cal').value,
        protein: document.getElementById('d-prot').value,
        carbs: document.getElementById('d-carbs').value,
        fats: document.getElementById('d-fats').value,
        water: document.getElementById('d-water').value
      };
      const dateVal = document.getElementById('d-date').value;
      saveLog('dietLogs', dateVal, entry);
      document.getElementById('d-food').value = '';
      document.getElementById('d-cal').value = '';
      document.getElementById('d-prot').value = '';
      document.getElementById('d-carbs').value = '';
      document.getElementById('d-fats').value = '';
      document.getElementById('d-water').value = '';
      renderDiet();
    });
    container.appendChild(form);
    // Show logs
    const logs = getLogs('dietLogs');
    const dateInput = form.querySelector('#d-date');
    dateInput.addEventListener('change', () => {
      renderDiet();
    });
    const currentDate = dateInput.value;
    const dayLogs = logs[currentDate] || [];
    if (dayLogs.length) {
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr><th>Meal</th><th>Food</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fats</th><th>Water (L)</th></tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector('tbody');
      dayLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${log.meal}</td><td>${log.food}</td><td>${log.calories}</td><td>${log.protein}</td><td>${log.carbs}</td><td>${log.fats}</td><td>${log.water}</td>`;
        tbody.appendChild(tr);
      });
      container.appendChild(table);
    }
  }

  // Renpho tab rendering
  function renderRenpho() {
    const container = document.getElementById('renpho');
    container.innerHTML = '';
    const form = document.createElement('form');
    const date = new Date().toISOString().slice(0, 10);
    form.innerHTML = `
      <label>Date
        <input type="date" id="r-date" value="${date}" min="${fullSchedule[0].date}" max="${fullSchedule[fullSchedule.length-1].date}" />
      </label>
      <label>Weight (kg)
        <input type="number" step="0.1" id="r-weight" min="0" />
      </label>
      <label>Body Fat %
        <input type="number" step="0.1" id="r-bf" min="0" max="100" />
      </label>
      <label>Muscle Mass (kg)
        <input type="number" step="0.1" id="r-muscle" min="0" />
      </label>
      <label>Visceral Fat
        <input type="number" step="0.1" id="r-visceral" min="0" />
      </label>
      <label>Metabolic Age
        <input type="number" step="0.1" id="r-metage" min="0" />
      </label>
      <button type="submit">Save Measurement</button>
    `;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const entry = {
        weight: document.getElementById('r-weight').value,
        bodyFat: document.getElementById('r-bf').value,
        muscleMass: document.getElementById('r-muscle').value,
        visceralFat: document.getElementById('r-visceral').value,
        metabolicAge: document.getElementById('r-metage').value
      };
      const dateVal = document.getElementById('r-date').value;
      saveLog('renphoLogs', dateVal, entry);
      document.getElementById('r-weight').value = '';
      document.getElementById('r-bf').value = '';
      document.getElementById('r-muscle').value = '';
      document.getElementById('r-visceral').value = '';
      document.getElementById('r-metage').value = '';
      renderRenpho();
    });
    container.appendChild(form);
    // Show logs
    const logs = getLogs('renphoLogs');
    const dateInput = form.querySelector('#r-date');
    dateInput.addEventListener('change', () => {
      renderRenpho();
    });
    const currentDate = dateInput.value;
    const dayLogs = logs[currentDate] || [];
    if (dayLogs.length) {
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr><th>Weight</th><th>Body Fat %</th><th>Muscle Mass</th><th>Visceral Fat</th><th>Metabolic Age</th></tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector('tbody');
      dayLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${log.weight}</td><td>${log.bodyFat}</td><td>${log.muscleMass}</td><td>${log.visceralFat}</td><td>${log.metabolicAge}</td>`;
        tbody.appendChild(tr);
      });
      container.appendChild(table);
    }
  }

  // Sleep tab rendering
  function renderSleep() {
    const container = document.getElementById('sleep');
    container.innerHTML = '';
    const form = document.createElement('form');
    const date = new Date().toISOString().slice(0, 10);
    form.innerHTML = `
      <label>Date
        <input type="date" id="s-date" value="${date}" min="${fullSchedule[0].date}" max="${fullSchedule[fullSchedule.length-1].date}" />
      </label>
      <label>Hours Slept
        <input type="number" step="0.1" id="s-hours" min="0" />
      </label>
      <label>Sleep Quality (1–10)
        <input type="number" id="s-quality" min="1" max="10" />
      </label>
      <label>Notes
        <input type="text" id="s-notes" />
      </label>
      <button type="submit">Save Sleep</button>
    `;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const entry = {
        hours: document.getElementById('s-hours').value,
        quality: document.getElementById('s-quality').value,
        notes: document.getElementById('s-notes').value
      };
      const dateVal = document.getElementById('s-date').value;
      saveLog('sleepLogs', dateVal, entry);
      document.getElementById('s-hours').value = '';
      document.getElementById('s-quality').value = '';
      document.getElementById('s-notes').value = '';
      renderSleep();
    });
    container.appendChild(form);
    // Show logs
    const logs = getLogs('sleepLogs');
    const dateInput = form.querySelector('#s-date');
    dateInput.addEventListener('change', () => {
      renderSleep();
    });
    const currentDate = dateInput.value;
    const dayLogs = logs[currentDate] || [];
    if (dayLogs.length) {
      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr><th>Hours</th><th>Quality</th><th>Notes</th></tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector('tbody');
      dayLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${log.hours}</td><td>${log.quality}</td><td>${log.notes}</td>`;
        tbody.appendChild(tr);
      });
      container.appendChild(table);
    }
  }

  // Summary tab rendering
  function renderSummary() {
    const container = document.getElementById('summary');
    container.innerHTML = '';
    const title = document.createElement('h2');
    title.textContent = 'Summary';
    container.appendChild(title);
    // Gather logs
    const renphoLogs = getLogs('renphoLogs');
    const dietLogs = getLogs('dietLogs');
    const sleepLogs = getLogs('sleepLogs');
    const workoutLogs = getLogs('workoutLogs');
    // Summaries
    // Weight change: show first and last weight if exists
    const renphoDates = Object.keys(renphoLogs).sort();
    if (renphoDates.length > 0) {
      const firstDate = renphoDates[0];
      const lastDate = renphoDates[renphoDates.length - 1];
      const firstWeight = renphoLogs[firstDate][0].weight;
      const lastWeight = renphoLogs[lastDate][renphoLogs[lastDate].length - 1].weight;
      const diff = (lastWeight - firstWeight).toFixed(1);
      const p = document.createElement('p');
      p.textContent = `Weight change: ${firstWeight} kg → ${lastWeight} kg (${diff >= 0 ? '+' : ''}${diff} kg)`;
      container.appendChild(p);
    }
    // Average calories and protein for the past 7 days
    function calculateDietAverages(days) {
      const endDate = new Date();
      const start = new Date();
      start.setDate(endDate.getDate() - (days - 1));
      let totalCal = 0;
      let totalProt = 0;
      let totalDaysWithData = 0;
      for (let d = 0; d < days; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + d);
        const dateStr = date.toISOString().slice(0, 10);
        const dayLogs = dietLogs[dateStr] || [];
        if (dayLogs.length) {
          totalDaysWithData++;
          dayLogs.forEach(log => {
            totalCal += Number(log.calories || 0);
            totalProt += Number(log.protein || 0);
          });
        }
      }
      return {
        avgCalories: totalDaysWithData ? (totalCal / totalDaysWithData).toFixed(0) : '0',
        avgProtein: totalDaysWithData ? (totalProt / totalDaysWithData).toFixed(0) : '0'
      };
    }
    const dietAvg = calculateDietAverages(7);
    const dietP = document.createElement('p');
    dietP.textContent = `Average calories/day (last 7 days): ${dietAvg.avgCalories} kcal, Average protein: ${dietAvg.avgProtein} g`;
    container.appendChild(dietP);
    // Average sleep hours
    function calculateSleepAverage(days) {
      const endDate = new Date();
      const start = new Date();
      start.setDate(endDate.getDate() - (days - 1));
      let totalHours = 0;
      let count = 0;
      for (let d = 0; d < days; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + d);
        const dateStr = date.toISOString().slice(0, 10);
        const dayLogs = sleepLogs[dateStr] || [];
        dayLogs.forEach(log => {
          totalHours += Number(log.hours || 0);
          count++;
        });
      }
      return count ? (totalHours / count).toFixed(1) : '0';
    }
    const avgSleep = calculateSleepAverage(7);
    const sleepP = document.createElement('p');
    sleepP.textContent = `Average sleep (last 7 days): ${avgSleep} hours`;
    container.appendChild(sleepP);
    // Last workout date
    const workoutDates = Object.keys(workoutLogs).sort();
    if (workoutDates.length) {
      const lastDate = workoutDates[workoutDates.length - 1];
      const workoutP = document.createElement('p');
      workoutP.textContent = `Last logged workout: ${lastDate}`;
      container.appendChild(workoutP);
    }
    if (!renphoDates.length && !workoutDates.length && !Object.keys(dietLogs).length && !Object.keys(sleepLogs).length) {
      const note = document.createElement('p');
      note.textContent = 'No data logged yet.';
      container.appendChild(note);
    }
  }

  // Render initial tab (Plan)
  renderPlan();
});