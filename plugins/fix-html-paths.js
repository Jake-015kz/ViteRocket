export const fixHtmlPaths = {
  name: "fix-html-paths",
  transformIndexHtml(html, ctx) {
    if (process.env.NODE_ENV === "production") {
      console.log("🔧 Исправляем HTML пути для build...");

      // Убираем /pages/ из ссылок
      const newHtml = html.replace(/href="\/pages\/([^"]+)"/g, 'href="/$1"');

      if (newHtml !== html) {
        console.log("✅ HTML пути исправлены");
        return newHtml;
      }
    }
    return html;
  },
};
