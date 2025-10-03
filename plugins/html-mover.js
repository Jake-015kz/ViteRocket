import fs from "fs-extra";

export const htmlMover = {
  name: "html-mover",
  writeBundle() {
    console.log("📄 Перемещаем HTML файлы в корень...");

    if (fs.existsSync("dist/pages")) {
      const htmlFiles = fs.readdirSync("dist/pages");
      htmlFiles.forEach((file) => {
        if (file.endsWith(".html")) {
          fs.moveSync(`dist/pages/${file}`, `dist/${file}`, {
            overwrite: true,
          });
          console.log(`✅ Перемещено: ${file} в корень`);
        }
      });

      fs.removeSync("dist/pages");
      console.log("✅ Папка pages удалена");
    }
  },
};
