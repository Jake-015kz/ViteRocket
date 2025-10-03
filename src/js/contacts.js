console.log('Страница "Контакты" загружена');

// Простая валидация формы
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".form");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      alert("Сообщение отправлено! (это демо)");
      form.reset();
    });
  }
});
