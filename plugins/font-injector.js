import fs from "fs-extra";
import path from "path";

export const fontInjector = {
  name: "font-injector",
  transform(src, id) {
    if (id.endsWith(".scss")) {
      console.log("🔤 Автоматически подключаем шрифты в CSS...");

      // Удаляем существующие @font-face правила с format("truetype")
      const cleanedSrc = src
        .replace(/@font-face\s*\{[^}]*format\(["']truetype["']\)[^}]*\}/gi, "")
        .trim();

      const fontsDir = "./public/fonts";
      if (!fs.existsSync(fontsDir)) {
        console.log("❌ Папка со шрифтами не найдена");
        return cleanedSrc;
      }

      const fontFiles = fs.readdirSync(fontsDir);
      const fontFaces = [];
      const fontMap = new Map(); // Для группировки шрифтов по имени, весу и стилю

      fontFiles.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        if (ext !== ".woff" && ext !== ".woff2") return; // Игнорируем TTF и другие форматы

        const name = path.basename(file, ext);
        let weight = 400;
        let style = "normal";

        // Определяем вес и стиль шрифта
        if (name.match(/bold/i)) weight = 700;
        else if (name.match(/light/i)) weight = 300;
        else if (name.match(/medium/i)) weight = 500;
        else if (name.match(/regular/i)) weight = 400;

        if (name.match(/italic/i) || name.match(/oblique/i)) style = "italic";

        // Извлекаем базовое имя шрифта
        const baseName =
          name
            .replace(/(bold|light|medium|regular|italic|oblique)/gi, "")
            .replace(/-$/, "")
            .trim() || "Font"; // Запасное имя, если результат пустой

        const key = `${baseName}-${weight}-${style}`;
        if (!fontMap.has(key)) {
          fontMap.set(key, {
            baseName,
            weight,
            style,
            formats: [],
          });
        }

        // Добавляем формат шрифта
        fontMap
          .get(key)
          .formats.push({ file, format: ext === ".woff2" ? "woff2" : "woff" });
      });

      // Формируем @font-face правила
      fontMap.forEach(({ baseName, weight, style, formats }) => {
        // Сортируем форматы, чтобы WOFF2 был первым
        const src = formats
          .sort((a, b) => (a.format === "woff2" ? -1 : 1)) // WOFF2 имеет приоритет
          .map(
            ({ file, format }) => `url('../fonts/${file}') format('${format}')`
          )
          .join(", ");

        fontFaces.push(
          `
          @font-face {
            font-family: "${baseName}";
            src: ${src};
            font-weight: ${weight};
            font-style: ${style};
            font-display: swap;
          }
        `.trim()
        );
      });

      if (fontFaces.length > 0) {
        console.log(`🔤 Добавлено ${fontFaces.length} @font-face правил`);
        return `@charset "UTF-8";\n\n${fontFaces.join(
          "\n\n"
        )}\n\n${cleanedSrc}`;
      } else {
        console.log("⚠️ Шрифты не найдены для добавления в CSS");
        return cleanedSrc;
      }
    }
    return src;
  },
};
