import fs from "fs-extra";
import { glob } from "glob";
import path from "path";

export const earlyScssTransformer = {
  name: "early-scss-transformer",

  buildStart() {
    console.log("🎨 Ранняя обработка SCSS файлов...");
    console.log("NODE_ENV:", process.env.NODE_ENV);

    if (process.env.NODE_ENV !== "production") {
      console.log("❌ Пропускаем - не production режим");
      return;
    }

    // Ищем все SCSS файлы
    const scssFiles = glob.sync("src/scss/**/*.scss");

    console.log(`🔍 Найдено SCSS файлов: ${scssFiles.length}`);

    if (scssFiles.length === 0) {
      console.log("❌ SCSS файлы не найдены");
      return;
    }

    let totalFilesProcessed = 0;
    let totalTransformations = 0;

    scssFiles.forEach((file) => {
      console.log(`\n🔧 Обрабатываем: ${path.basename(file)}`);

      try {
        let content = fs.readFileSync(file, "utf-8");
        let transformed = false;
        let transformCount = 0;

        // 🔍 ДЕБАГ: Покажем все background-image в файле
        const bgImages = content.match(
          /background-image:[^;]*url\([^)]+\)[^;]*;/gi
        );
        if (bgImages) {
          console.log(`🔍 Найдены background-image:`, bgImages.length);
          bgImages.forEach((bg, index) => {
            console.log(`   ${index + 1}: ${bg}`);
          });
        }

        // 🔧 ИЩЕМ КОНКРЕТНО ВАШ СЛУЧАЙ: background-image с путями к content изображениям
        const newContent = content.replace(
          /background-image:\s*url\(['"]?\.\.\/img\/content\/([^'")]+\.(jpg|jpeg|png))['"]?\);/gi,
          (match, imageName, ext) => {
            console.log(
              `🎨 Нашли изображение для преобразования: ${imageName}`
            );
            transformCount++;
            totalTransformations++;

            const baseName = imageName.replace(/\.(jpg|jpeg|png)$/i, "");

            // 🔥 КРИТИЧЕСКИ ИЗМЕНЕНИЕ: убираем /content/ из пути!
            return `
              /* Фолбэк для старых браузеров */
              background-image: url('../img/${baseName}-desktop.jpg');

              /* Современные браузеры с image-set и ретиной */
              background-image: -webkit-image-set(
                url('../img/${baseName}-desktop.avif') 1x,
                url('../img/${baseName}-retina.avif') 2x,
                url('../img/${baseName}-desktop.webp') 1x,
                url('../img/${baseName}-retina.webp') 2x
              );

              background-image: image-set(
                url('../img/${baseName}-desktop.avif') 1x,
                url('../img/${baseName}-retina.avif') 2x,
                url('../img/${baseName}-desktop.webp') 1x,
                url('../img/${baseName}-retina.webp') 2x
              );
            `.trim();
          }
        );

        if (transformCount > 0) {
          fs.writeFileSync(file, newContent, "utf-8");
          console.log(`✅ Преобразовано ${transformCount} background-image`);
          totalFilesProcessed++;
          transformed = true;
        }

        if (!transformed) {
          console.log(`❌ Не найдено background-image для преобразования`);

          // 🔍 ДЕТАЛЬНЫЙ ДЕБАГ: покажем почему не нашел
          const testMatch = content.match(
            /background-image:\s*url\(['"]?\.\.\/img\/content\/([^'")]+\.(jpg|jpeg|png))['"]?\);/gi
          );
          if (testMatch) {
            console.log(`🔍 Паттерн нашел:`, testMatch);
          } else {
            console.log(`🔍 Паттерн не нашел совпадений`);
          }
        }
      } catch (error) {
        console.error(`❌ Ошибка обработки ${file}:`, error.message);
      }
    });

    console.log(
      `\n🎉 ИТОГ: Обработано ${totalFilesProcessed}/${scssFiles.length} файлов`
    );
    console.log(`🎉 Всего преобразований: ${totalTransformations}`);
  },
};
