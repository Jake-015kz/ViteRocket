import fs from "fs-extra";
import { glob } from "glob";
import path from "path";

function wrapImagesInSource() {
  console.log("🖼️ Раннее оборачивание изображений в HTML...");

  const htmlFiles = glob.sync("src/pages/**/*.html");
  console.log(`📄 Найдено ${htmlFiles.length} HTML файлов для обработки`);

  let totalWrapped = 0;

  htmlFiles.forEach((file) => {
    console.log(`🔧 Обрабатываем: ${path.basename(file)}`);
    let html = fs.readFileSync(file, "utf-8");
    let wrappedCount = 0;

    // Ищем изображения в исходных путях (до обработки Vite)
    const imgRegex =
      /<img\s+[^>]*src="([^"]*img\/content\/[^"]+\.(jpg|jpeg|png))"[^>]*>/gi;

    const newHtml = html.replace(imgRegex, (match, src) => {
      console.log(`🖼️ Найдено изображение: ${src}`);

      const fileName = path.basename(src);
      const baseName = fileName.replace(/\.(jpg|jpeg|png)$/i, "");
      const originalExt = path.extname(src).toLowerCase().replace(".", "");

      // Извлекаем атрибуты
      const altMatch = match.match(/alt="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : "";

      const classMatch = match.match(/class="([^"]*)"/);
      const classes = classMatch ? `class="${classMatch[1]}"` : "";

      const loadingMatch = match.match(/loading="([^"]*)"/);
      const loading = loadingMatch ? loadingMatch[1] : "lazy";

      // Создаем picture с путями которые БУДУТ после сборки
      const picture = `<picture>
        <source type="image/avif" srcset="/img/${baseName}-mobile.avif 600w, /img/${baseName}-tablet.avif 1000w, /img/${baseName}-desktop.avif 1600w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1200px">
        <source type="image/webp" srcset="/img/${baseName}-mobile.webp 600w, /img/${baseName}-tablet.webp 1000w, /img/${baseName}-desktop.webp 1600w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1200px">
        <img src="/img/${baseName}-desktop.${originalExt}" alt="${alt}" ${classes} loading="${loading}">
      </picture>`;

      wrappedCount++;
      return picture;
    });

    if (wrappedCount > 0) {
      fs.writeFileSync(file, newHtml, "utf-8");
      console.log(
        `✅ Обернуто ${wrappedCount} изображений в ${path.basename(file)}`
      );
      totalWrapped += wrappedCount;
    }
  });

  console.log(
    `🎉 Всего обернуто ${totalWrapped} изображений в исходных файлах`
  );
}

export const earlyPictureWrapper = {
  name: "early-picture-wrapper",

  // Работаем ДО обработки Vite
  buildStart() {
    if (process.env.NODE_ENV === "production") {
      wrapImagesInSource();
    }
  },
};
