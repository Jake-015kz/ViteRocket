import fs from "fs-extra";
import path from "path";
import { optimize } from "svgo";

export const svgSpriteGenerator = {
  name: "svg-sprite-generator",

  // Для build режима
  generateBundle() {
    console.log("🎨 Генерируем SVG спрайт...");

    const iconsDir = path.resolve("src/img/icons");

    // Проверяем существование папки с иконками
    if (!fs.existsSync(iconsDir)) {
      console.log(
        "📁 Папка с иконками не найдена, пропускаем генерацию спрайта"
      );
      return;
    }

    const files = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".svg"));

    if (files.length === 0) {
      console.log("ℹ️ SVG иконки не найдены, пропускаем генерацию спрайта");
      return;
    }

    console.log(`🎨 Найдено ${files.length} SVG иконок для спрайта`);

    let sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n`;

    for (const file of files) {
      try {
        const filePath = path.join(iconsDir, file);
        const content = fs.readFileSync(filePath, "utf8");

        // Оптимизируем SVG
        const optimized = optimize(content, {
          plugins: [
            { name: "removeDimensions" },
            { name: "removeStyleElement" },
            { name: "removeScriptElement" },
            { name: "removeTitle" },
            { name: "removeDesc" },
          ],
        });

        // Извлекаем содержимое между тегами svg
        const body = optimized.data
          .replace(/<svg[^>]*>/, "")
          .replace(/<\/svg>/, "")
          .trim();

        // Извлекаем viewBox или устанавливаем по умолчанию
        const viewBoxMatch = optimized.data.match(/viewBox="([^"]+)"/);
        const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";

        const name = path.parse(file).name;

        // Добавляем символ в спрайт
        sprite += `  <symbol id="icon-${name}" viewBox="${viewBox}">${body}</symbol>\n`;
        console.log(`✅ Добавлена иконка: ${name}`);
      } catch (error) {
        console.error(`❌ Ошибка обработки ${file}:`, error.message);
      }
    }

    sprite += `</svg>`;

    // Сохраняем спрайт как asset в dist
    this.emitFile({
      type: "asset",
      fileName: "img/sprite.svg",
      source: sprite,
    });

    console.log("✅ SVG спрайт создан: dist/img/sprite.svg");
  },

  // Для dev режима - генерируем спрайт в public
  buildStart() {
    if (process.env.NODE_ENV === "development") {
      console.log("🎨 Генерируем SVG спрайт для dev...");

      const iconsDir = path.resolve("src/img/icons");

      if (!fs.existsSync(iconsDir)) {
        return;
      }

      const files = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".svg"));

      if (files.length === 0) {
        return;
      }

      let sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n`;

      for (const file of files) {
        try {
          const filePath = path.join(iconsDir, file);
          const content = fs.readFileSync(filePath, "utf8");
          const optimized = optimize(content, {
            plugins: [{ name: "removeDimensions" }],
          });

          const body = optimized.data
            .replace(/<svg[^>]*>/, "")
            .replace(/<\/svg>/, "")
            .trim();

          const viewBox =
            optimized.data.match(/viewBox="([^"]+)"/)?.[1] || "0 0 24 24";
          const name = path.parse(file).name;

          sprite += `  <symbol id="icon-${name}" viewBox="${viewBox}">${body}</symbol>\n`;
        } catch (error) {
          // Игнорируем ошибки в dev режиме
        }
      }

      sprite += `</svg>`;

      const outputPath = "public/img/sprite.svg";
      fs.ensureDirSync(path.dirname(outputPath));
      fs.writeFileSync(outputPath, sprite);
    }
  },
};
