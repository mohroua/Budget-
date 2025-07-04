// تحميل الوضع الليلي عند تشغيل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  const isDark = localStorage.getItem("dark-mode") === "true";
  document.documentElement.classList.toggle("dark-mode", isDark);
  updateUI(); // تحميل الواجهة فورًا
});

// تبديل الوضع الليلي وتخزينه
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark-mode");
  localStorage.setItem("dark-mode", isDark);
  if (expenseChartInstance) {
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    const cardBackground = getComputedStyle(document.documentElement).getPropertyValue('--card-background');
    expenseChartInstance.options.plugins.legend.labels.color = textColor;
    expenseChartInstance.data.datasets[0].borderColor = cardBackground;
    expenseChartInstance.update();
  }
}

// تسجيل الـ Service Worker لتفعيل PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker مسجل:', reg.scope))
      .catch(err => console.log('فشل تسجيل Service Worker:', err));
  });
}

// استرجاع البيانات من localStorage
let budget = JSON.parse(localStorage.getItem("budget") || "null");
let balances = JSON.parse(localStorage.getItem("balances") || "null");
let log = JSON.parse(localStorage.getItem("log") || "[]");

// نصائح ذكية
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
  const salary = parseFloat(document.getElementById("salaryInput").value);
  const p1 = parseFloat(document.getElementById("essentialsPercent").value);
  const p2 = parseFloat(document.getElementById("secondaryPercent").value);
  const p3 = parseFloat(document.getElementById("improvementsPercent").value);

  if (isNaN(salary) || salary <= 0 || p1 + p2 + p3 !== 100) {
    alert("⚠️ تأكد من إدخال راتب صحيح وأن تكون النسب = 100%");
    return;
  }

  budget = { salary, p1, p2, p3 };
  balances = {
    essentials: salary * p1 / 100,
    secondary: salary * p2 / 100,
    improvements: salary * p3 / 100
  };
  log = [];

  localStorage.setItem("budget", JSON.stringify(budget));
  localStorage.setItem("balances", JSON.stringify(balances));
  localStorage.setItem("log", JSON.stringify(log));

  updateUI();
  showRandomTip();

  document.getElementById("salaryInput").value = '';
  document.getElementById("essentialsPercent").value = '50';
  document.getElementById("secondaryPercent").value = '30';
  document.getElementById("improvementsPercent").value = '20';
}

function addExpense() {
  const name = document.getElementById("expenseName").value.trim();
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const category = document.getElementById("expenseCategory").value;

  if (!name || isNaN(amount) || amount <= 0 || balances[category] < amount) {
    alert("🚫 تحقق من الاسم والمبلغ والرصيد.");
    return;
  }

  balances[category] -= amount;
  const entry = {
    name,
    amount,
    category,
    date: new Date().toLocaleDateString("ar-DZ")
  };
  log.push(entry);

  localStorage.setItem("balances", JSON.stringify(balances));
  localStorage.setItem("log", JSON.stringify(log));

  updateUI();
  showRandomTip();

  document.getElementById("expenseName").value = '';
  document.getElementById("expenseAmount").value = '';
  document.getElementById("expenseCategory").value = 'essentials';
}

let expenseChartInstance = null;

function updateUI() {
  const show = budget && balances;
  document.getElementById("balances").style.display = show ? "block" : "none";
  document.getElementById("expenseForm").style.display = show ? "block" : "none";
  document.getElementById("logSection").style.display = show ? "block" : "none";

  if (!show) return;

  document.getElementById("balanceEssentials").textContent = balances.essentials.toFixed(2);
  document.getElementById("balanceSecondary").textContent = balances.secondary.toFixed(2);
  document.getElementById("balanceImprovements").textContent = balances.improvements.toFixed(2);

  const filter = document.getElementById("filterCategory").value;
  const list = document.getElementById("logList");
  list.innerHTML = "";

  const filteredLog = log.filter(e => filter === "all" || e.category === filter);

  if (filteredLog.length === 0) {
    list.innerHTML = `<div style="text-align:center; color:var(--light-text-color); padding:20px;">لا توجد مصروفات.</div>`;
  } else {
    filteredLog.slice().reverse().forEach(e => {
      const div = document.createElement("div");
      div.className = "log-entry";
      div.innerHTML = `
        <div><strong>${e.name}</strong> - <span style="color:${e.category === 'essentials' ? '#4CAF50' : e.category === 'secondary' ? '#FFC107' : '#2196F3'};">${e.amount.toFixed(2)} دج</span></div>
        <small>${e.date} | الفئة: ${e.category === 'essentials' ? 'ضروري' : e.category === 'secondary' ? 'ثانوي' : 'تحسيني'}</small>
      `;
      list.appendChild(div);
    });
  }

  updateChart();
}

function updateChart() {
  if (expenseChartInstance) expenseChartInstance.destroy();

  const spentEssentials = log.filter(e => e.category === 'essentials').reduce((s, e) => s + e.amount, 0);
  const spentSecondary = log.filter(e => e.category === 'secondary').reduce((s, e) => s + e.amount, 0);
  const spentImprovements = log.filter(e => e.category === 'improvements').reduce((s, e) => s + e.amount, 0);

  const chartData = [
    (budget.salary * budget.p1 / 100) - spentEssentials,
    (budget.salary * budget.p2 / 100) - spentSecondary,
    (budget.salary * budget.p3 / 100) - spentImprovements
  ];

  expenseChartInstance = new Chart(document.getElementById("expenseChart"), {
    type: 'doughnut',
    data: {
      labels: ["الضروريات", "الثانويات", "التحسينيات"],
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
            font: { family: 'Cairo, sans-serif', size: 14 }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(2)} دج`
          },
          bodyFont: { family: 'Cairo, sans-serif' },
          titleFont: { family: 'Cairo, sans-serif' }
        }
      }
    }
  });
}

function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const rows = log.map(e => [
    e.category === 'essentials' ? 'ضروري' : e.category === 'secondary' ? 'ثانوي' : 'تحسيني',
    e.amount.toFixed(2),
    e.name,
    e.date
  ]);

  doc.setFont("helvetica", "bold");
  doc.text("سجل المصروفات", doc.internal.pageSize.width / 2, 20, { align: "center" });

  doc.autoTable({
    startY: 30,
    head: [["الفئة", "المبلغ", "الاسم", "التاريخ"]],
    body: rows,
    styles: { fontSize: 10, halign: 'right' },
    headStyles: { fillColor: [52, 168, 83], textColor: 255 }
  });

  doc.save("سجل-المصروفات.pdf");
}
