import fs from "fs-extra";
import path from "path";
import sharp from "sharp";

export const imageGenerator = {
  name: "image-generator",
  enforce: "pre",
  async buildStart() {
    console.log("🖼️ Начинаем генерацию изображений...");
    const imageDir = "./src/img/content";
    const outputDir = "./public/img";

    if (!fs.existsSync(imageDir)) {
      console.log("❌ Папка с изображениями не найдена:", imageDir);
      return;
    }

    const images = fs
      .readdirSync(imageDir)
      .filter((file) => /\.(jpg|jpeg|png)$/i.test(file));

    console.log(`🖼️ Найдено ${images.length} изображений для обработки`);

    fs.removeSync(outputDir);
    fs.ensureDirSync(outputDir);

    for (const imageFile of images) {
      const imagePath = path.join(imageDir, imageFile);
      const imageName = path.parse(imageFile).name;

      try {
        const metadata = await sharp(imagePath).metadata();
        const originalWidth = metadata.width;

        console.log(`🖼️ Обрабатываем: ${imageFile} (${originalWidth}px)`);

        const sizes = [
          { suffix: "mobile", width: Math.min(600, originalWidth) },
          { suffix: "tablet", width: Math.min(1000, originalWidth) },
          { suffix: "desktop", width: Math.min(1600, originalWidth) },
          { suffix: "retina", width: Math.min(2400, originalWidth) },
        ];

        const uniqueSizes = sizes.filter(
          (size, index, self) =>
            index === self.findIndex((s) => s.width === size.width)
        );

        const formats = [
          { ext: "jpg", options: { quality: 85 } },
          { ext: "webp", options: { quality: 80 } },
          { ext: "avif", options: { quality: 60 } },
        ];

        for (const size of uniqueSizes) {
          for (const format of formats) {
            const outputFile = `${imageName}-${size.suffix}.${format.ext}`;
            const outputPath = path.join(outputDir, outputFile);

            let sharpInstance = sharp(imagePath);

            if (size.width < originalWidth) {
              sharpInstance = sharpInstance.resize(size.width);
            } else {
              console.log(
                `📏 Размер ${size.suffix} совпадает с оригиналом, только конвертируем`
              );
            }

            switch (format.ext) {
              case "jpg":
                await sharpInstance.jpeg(format.options).toFile(outputPath);
                break;
              case "webp":
                await sharpInstance.webp(format.options).toFile(outputPath);
                break;
              case "avif":
                await sharpInstance.avif(format.options).toFile(outputPath);
                break;
            }

            console.log(`✅ Сгенерировано: ${outputFile} (${size.width}px)`);
          }
        }
      } catch (error) {
        console.error(`❌ Ошибка обработки ${imageFile}:`, error.message);
      }
    }
    console.log("🖼️ Генерация изображений завершена!");
  },
};
