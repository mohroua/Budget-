// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

let budget = JSON.parse(localStorage.getItem("budget") || "null");
let balances = JSON.parse(localStorage.getItem("balances") || "null");
let log = JSON.parse(localStorage.getItem("log") || "[]");

const tips = [
  "💡 حاول توفير 10% من راتبك للطوارئ. المدخرات هي مفتاح الاستقرار المالي!",
  "📌 راجع مصاريفك الأسبوعية لتبقى على اطلاع بإنفاقك وتجنب المفاجآت.",
  "🪙 احذف الاشتراكات غير الضرورية. كل دينار توفره يضاف إلى رصيدك!",
  "💰 استخدم قاعدة 50/30/20: 50% للضروريات، 30% للثانويات، 20% للمدخرات والديون.",
  "💸 ضع لنفسك أهدافاً مالية واضحة، سواء كانت صغيرة أو كبيرة، لتحفيزك على الادخار."
];

function showRandomTip() {
  const tip = tips[Math.floor(Math.random() * tips.length)];
  alert(tip);
}

function setBudget() {
  const salaryInput = document.getElementById("salaryInput");
  const p1Input = document.getElementById("essentialsPercent");
  const p2Input = document.getElementById("secondaryPercent");
  const p3Input = document.getElementById("improvementsPercent");

  const salary = parseFloat(salaryInput.value);
  const p1 = parseFloat(p1Input.value);
  const p2 = parseFloat(p2Input.value);
  const p3 = parseFloat(p3Input.value);

  if (isNaN(salary) || salary <= 0 || isNaN(p1) || isNaN(p2) || isNaN(p3) || (p1 + p2 + p3 !== 100)) {
    alert("⚠️ يرجى التحقق من صحة المدخلات. يجب أن يكون الراتب رقماً موجباً وأن يكون مجموع النسب 100%.");
    return;
  }

  budget = { salary, p1, p2, p3 };
  balances = {
    essentials: salary * p1 / 100,
    secondary: salary * p2 / 100,
    improvements: salary * p3 / 100
  };
  log = []; // Reset log on new budget
  localStorage.setItem("budget", JSON.stringify(budget));
  localStorage.setItem("balances", JSON.stringify(balances));
  localStorage.setItem("log", JSON.stringify(log));
  updateUI();
  showRandomTip();

  // Clear input fields after successful budget setting
  salaryInput.value = '';
  p1Input.value = '50';
  p2Input.value = '30';
  p3Input.value = '20';
}

function addExpense() {
  const nameInput = document.getElementById("expenseName");
  const amountInput = document.getElementById("expenseAmount");
  const categorySelect = document.getElementById("expenseCategory");

  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!name || isNaN(amount) || amount <= 0 || !balances[category] || balances[category] < amount) {
    alert("🚫 يرجى التحقق من البيانات: تأكد من إدخال اسم ومبلغ صحيحين، وأن المبلغ لا يتجاوز الرصيد المتاح في الفئة.");
    return;
  }

  balances[category] -= amount;
  const entry = { name, amount, category, date: new Date().toLocaleDateString("ar-DZ") };
  log.push(entry);
  localStorage.setItem("balances", JSON.stringify(balances));
  localStorage.setItem("log", JSON.stringify(log));
  updateUI();
  showRandomTip();

  // Clear input fields after adding expense
  nameInput.value = '';
  amountInput.value = '';
  categorySelect.value = 'essentials';
}

let expenseChartInstance = null; // To store chart instance

function updateUI() {
  if (!budget || !balances) {
    // Hide relevant sections if budget not set
    document.getElementById("balances").style.display = "none";
    document.getElementById("expenseForm").style.display = "none";
    document.getElementById("logSection").style.display = "none";
    return;
  }
  document.getElementById("balances").style.display = "block";
  document.getElementById("expenseForm").style.display = "block";
  document.getElementById("logSection").style.display = "block";

  document.getElementById("balanceEssentials").textContent = balances.essentials.toFixed(2);
  document.getElementById("balanceSecondary").textContent = balances.secondary.toFixed(2);
  document.getElementById("balanceImprovements").textContent = balances.improvements.toFixed(2);

  const filter = document.getElementById("filterCategory").value;
  const list = document.getElementById("logList");
  list.innerHTML = "";

  const filteredLog = log.filter(e => filter === "all" || e.category === filter);

  if (filteredLog.length === 0) {
    list.innerHTML = '<div style="text-align: center; color: var(--light-text-color); padding: 20px;">لا توجد مصروفات لعرضها في هذه الفئة.</div>';
  } else {
    filteredLog.slice().reverse().forEach(e => {
      const div = document.createElement("div");
      div.className = "log-entry";
      div.innerHTML = `
        <div><strong>${e.name}</strong> - <span style="color: ${e.category === 'essentials' ? '#4CAF50' : e.category === 'secondary' ? '#FFC107' : '#2196F3'};">${e.amount.toFixed(2)} دج</span></div>
        <small>${e.date} | الفئة: ${e.category === 'essentials' ? 'ضروري' : e.category === 'secondary' ? 'ثانوي' : 'تحسيني'}</small>
      `;
      list.appendChild(div);
    });
  }

  updateChart();
}

function updateChart() {
  // Destroy old chart instance if it exists
  if (expenseChartInstance) {
    expenseChartInstance.destroy();
  }

  const totalSpentEssentials = log.filter(e => e.category === 'essentials').reduce((sum, entry) => sum + entry.amount, 0);
  const totalSpentSecondary = log.filter(e => e.category === 'secondary').reduce((sum, entry) => sum + entry.amount, 0);
  const totalSpentImprovements = log.filter(e => e.category === 'improvements').reduce((sum, entry) => sum + entry.amount, 0);

  // تحقق مما إذا كانت الميزانية مضبوطة قبل محاولة الوصول إلى خصائصها
  const chartData = [
    (budget ? budget.salary * budget.p1 / 100 : 0) - totalSpentEssentials,
    (budget ? budget.salary * budget.p2 / 100 : 0) - totalSpentSecondary,
    (budget ? budget.salary * budget.p3 / 100 : 0) - totalSpentImprovements
  ];

  expenseChartInstance = new Chart(document.getElementById("expenseChart"), {
    type: 'doughnut',
    data: {
      labels: ["المتبقي في الضروريات", "المتبقي في الثانويات", "المتبقي في التحسينيات"],
      datasets: [{
        data: chartData,
        backgroundColor: ["#4CAF50", "#FFC107", "#2196F3"],
        hoverOffset: 8,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card-background'),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
            font: {
              family: 'Cairo, sans-serif',
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed !== null) {
                label += context.parsed.toFixed(2) + ' دج';
              }
              return label;
            }
          },
          bodyFont: {
            family: 'Cairo, sans-serif'
          },
          titleFont: {
            family: 'Cairo, sans-serif'
          }
        }
      }
    }
  });
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait"
  });

  const tableColumn = ["الفئة", "المبلغ (دج)", "اسم المصروف", "التاريخ"];
  const tableRows = [];

  log.forEach(e => {
    tableRows.push([
      e.category === 'essentials' ? 'ضروري' : e.category === 'secondary' ? 'ثانوي' : 'تحسيني',
      e.amount.toFixed(2),
      e.name,
      e.date
    ]);
  });

  doc.setFont("helvetica", "bold");
  doc.text("سجل المصروفات", doc.internal.pageSize.width / 2, 20, { align: "center" });

  doc.autoTable({
    startY: 30,
    head: [tableColumn],
    body: tableRows,
    styles: {
      font: "helvetica",
      fontSize: 10,
      halign: 'right' // Align text to right for Arabic
    },
    headStyles: {
      fillColor: [52, 168, 83], // Primary color for table header
      textColor: 255,
      halign: 'right'
    },
    columnStyles: {
      0: { halign: 'right' }, // Category
      1: { halign: 'right' }, // Amount
      2: { halign: 'right' }, // Name
      3: { halign: 'right' }  // Date
    },
    margin: { top: 25 }
  });

  doc.save("سجل-المصروفات.pdf");
}

function toggleDarkMode() {
  document.documentElement.classList.toggle("dark-mode");
  // Update chart colors if in dark mode
  if (expenseChartInstance) {
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
      const cardBackground = getComputedStyle(document.documentElement).getPropertyValue('--card-background');
      expenseChartInstance.options.plugins.legend.labels.color = textColor;
      expenseChartInstance.data.datasets[0].borderColor = cardBackground;
      expenseChartInstance.update();
  }
}

// Initial load and UI update
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  // Apply dark mode preference on load if exists
  if (localStorage.getItem('darkMode') === 'enabled') {
      document.documentElement.classList.add('dark-mode');
  }
});

// Save dark mode preference
document.documentElement.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'background-color' && e.target === document.documentElement) {
        if (document.documentElement.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.removeItem('darkMode');
        }
    }
});
