import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";

export const fontConverter = {
  name: "font-converter",
  enforce: "pre",
  async buildStart() {
    console.log("🔤 Начинаем конвертацию шрифтов из TTF в WOFF/WOFF2...");
    const fontDir = "./src/fonts";
    const outputDir = "./public/fonts";

    if (!fs.existsSync(fontDir)) {
      console.log("❌ Папка со шрифтами не найдена:", fontDir);
      return;
    }

    const ttfFiles = fs
      .readdirSync(fontDir)
      .filter((file) => /\.ttf$/i.test(file));

    console.log(`🔤 Найдено ${ttfFiles.length} TTF шрифтов для конвертации`);

    fs.removeSync(outputDir);
    fs.ensureDirSync(outputDir);

    for (const ttfFile of ttfFiles) {
      const ttfPath = path.join(fontDir, ttfFile);
      const fontName = path.parse(ttfFile).name;

      try {
        console.log(`🔤 Конвертируем: ${ttfFile}`);

        // Конвертация в WOFF
        const woffFile = `${fontName}.woff`;
        const woffPath = path.join(outputDir, woffFile);
        try {
          execSync(`npx ttf2woff "${ttfPath}" "${woffPath}"`, {
            stdio: "inherit",
          });
          console.log(`✅ Сконвертирован WOFF: ${woffFile}`);
        } catch (error) {
          console.log(
            `⚠️ Не удалось сконвертировать в WOFF: ${ttfFile}`,
            error.message
          );
        }

        // Конвертация в WOFF2
        const woff2File = `${fontName}.woff2`;
        const woff2Path = path.join(outputDir, woff2File);
        try {
          execSync(
            `pyftsubset "${ttfPath}" --output-file="${woff2Path}" --flavor=woff2`,
            { stdio: "inherit" }
          );
          console.log(`✅ Сконвертирован WOFF2: ${woff2File}`);
        } catch (error) {
          console.log(
            `⚠️ Не удалось сконвертировать в WOFF2: ${ttfFile}`,
            error.message
          );
          // Fallback: копируем существующий WOFF2, если есть
          const existingWoff2 = fs
            .readdirSync(fontDir)
            .find((f) => f.includes(fontName) && f.endsWith(".woff2"));
          if (existingWoff2) {
            fs.copySync(path.join(fontDir, existingWoff2), woff2Path);
            console.log(`✅ Скопирован существующий WOFF2: ${existingWoff2}`);
          }
        }
      } catch (error) {
        console.error(`❌ Ошибка конвертации ${ttfFile}:`, error.message);
      }
    }
    console.log("🔤 Конвертация шрифтов завершена!");
  },
};
