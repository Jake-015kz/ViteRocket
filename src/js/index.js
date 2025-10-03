// src/js/index.js
import "../scss/styles.scss";

console.log("JS подключен!");

document.addEventListener("DOMContentLoaded", function () {
  // Элементы
  const burger = document.querySelector(".header__burger");
  const nav = document.querySelector(".header__nav");
  const navLinks = document.querySelectorAll(".nav__link");

  // Функция для бургер-меню
  function initBurgerMenu() {
    if (!burger || !nav) return;

    burger.addEventListener("click", function () {
      burger.classList.toggle("active");
      nav.classList.toggle("active");

      // Блокируем скролл при открытом меню
      document.body.style.overflow = nav.classList.contains("active")
        ? "hidden"
        : "";
    });
  }

  // Функция для закрытия меню при клике на ссылку
  function initNavLinks() {
    navLinks.forEach((link) => {
      link.addEventListener("click", function () {
        if (burger && nav) {
          burger.classList.remove("active");
          nav.classList.remove("active");
          document.body.style.overflow = ""; // Разблокируем скролл
        }
      });
    });
  }

  // Функция для подсветки активной страницы
  function setActiveNav() {
    const currentPath = window.location.pathname;
    let currentPage = currentPath.split("/").pop();

    // Обработка главной страницы
    if (
      !currentPage ||
      currentPath.endsWith("/") ||
      currentPage === "index.html"
    ) {
      currentPage = "/";
    }

    console.log("Текущая страница:", currentPage);

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const linkHref = link.getAttribute("href");

      // Сравниваем пути
      if (
        linkHref === currentPage ||
        (currentPage === "/" && linkHref === "/") ||
        (currentPage !== "/" && linkHref.endsWith(currentPage))
      ) {
        link.classList.add("active");
      }
    });
  }

  // Функция для закрытия меню при клике вне его области
  function initOutsideClick() {
    document.addEventListener("click", function (event) {
      if (!burger || !nav) return;

      const isClickInsideNav = nav.contains(event.target);
      const isClickOnBurger = burger.contains(event.target);

      if (
        !isClickInsideNav &&
        !isClickOnBurger &&
        nav.classList.contains("active")
      ) {
        burger.classList.remove("active");
        nav.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }

  // Функция для закрытия меню при ресайзе окна (на десктоп)
  function initResizeHandler() {
    window.addEventListener("resize", function () {
      if (window.innerWidth > 768 && nav && nav.classList.contains("active")) {
        burger.classList.remove("active");
        nav.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }

  // Инициализация всех функций
  function init() {
    initBurgerMenu();
    initNavLinks();
    setActiveNav();
    initOutsideClick();
    initResizeHandler();
  }

  // Запускаем инициализацию
  init();
});
