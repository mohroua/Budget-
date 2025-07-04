// استرجاع الوضع الليلي عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  const isDark = localStorage.getItem("dark-mode") === "true";
  document.documentElement.classList.toggle("dark-mode", isDark);
});

// تبديل الوضع الليلي وتحديث التخزين
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark-mode");
  localStorage.setItem("dark-mode", isDark);
}
