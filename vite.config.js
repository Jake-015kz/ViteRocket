import fs from "fs-extra";
import { glob } from "glob";
import path from "path";
import postcssImageSet from "postcss-image-set-function";
import postcssPresetEnv from "postcss-preset-env";
import { defineConfig } from "vite";
import progress from "vite-plugin-progress";

// Импортируем плагины
import { earlyPictureWrapper } from "./plugins/early-picture-wrapper.js";
import { earlyScssTransformer } from "./plugins/early-scss-transformer.js";
import { fixHtmlPaths } from "./plugins/fix-html-paths.js";
import { fontConverter } from "./plugins/font-converter.js";
import { fontInjector } from "./plugins/font-injector.js";
import { htmlMover } from "./plugins/html-mover.js";
import { imageGenerator } from "./plugins/image-generator.js";
import { svgSpriteGenerator } from "./plugins/svg-sprite-generator.js";

// Улучшенный плагин для инклюдов с поддержкой лайаутов
const htmlIncludePlugin = () => {
  return {
    name: "html-include",
    transformIndexHtml: {
      order: "pre", // Очень важно - ДО обработки Vite
      handler(html, ctx) {
        console.log(`📄 Обрабатываем HTML: ${path.basename(ctx.filename)}`);

        const processIncludes = (content, currentDir, slotContent = "") => {
          return content.replace(
            /<include\s+src="([^"]+)"\s*>(.*?)<\/include>/gis,
            (match, includePath, slot) => {
              try {
                let fullPath;

                // Поддержка разных путей
                if (includePath.startsWith("components/")) {
                  fullPath = path.resolve(
                    "src/components",
                    includePath.replace("components/", "")
                  );
                } else if (includePath.startsWith("layout/")) {
                  fullPath = path.resolve(
                    "src/layout",
                    includePath.replace("layout/", "")
                  );
                } else if (includePath.startsWith("libs/")) {
                  fullPath = path.resolve(
                    "src/libs",
                    includePath.replace("libs/", "")
                  );
                } else {
                  fullPath = path.resolve(currentDir, includePath);
                }

                if (fs.existsSync(fullPath)) {
                  let includedContent = fs.readFileSync(fullPath, "utf-8");

                  // Заменяем <slot></slot> на переданный контент
                  if (slot && slot.trim()) {
                    includedContent = includedContent.replace(
                      /<slot><\/slot>/g,
                      slot.trim()
                    );
                  }

                  console.log(`✅ Включен файл: ${includePath}`);

                  const dir = path.dirname(fullPath);
                  return processIncludes(includedContent, dir);
                } else {
                  console.error(`❌ Файл не найден: ${includePath}`);
                  return `<!-- ERROR: File ${includePath} not found -->`;
                }
              } catch (error) {
                console.error(`❌ Ошибка включения ${includePath}:`, error);
                return `<!-- ERROR: ${error.message} -->`;
              }
            }
          );
        };

        const currentDir = path.dirname(ctx.filename);
        const result = processIncludes(html, currentDir);

        const includeCount = (html.match(/<include/g) || []).length;
        if (includeCount > 0) {
          console.log(`🎉 Обработано ${includeCount} инклюдов`);
        }

        return result;
      },
    },
  };
};

export default defineConfig(({ command }) => {
  const isBuild = command === "build";
  const isDev = command === "serve";

  return {
    root: "src",
    base: isDev ? "/" : "/",
    publicDir: "../public",
    build: {
      outDir: "../dist",
      emptyOutDir: true,
      rollupOptions: {
        input: Object.fromEntries(
          glob
            .sync("src/pages/*.html")
            .map((file) => [path.basename(file, path.extname(file)), file])
        ),
        output: {
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name?.split(".").pop();

            if (ext === "css") {
              return "css/[name][extname]";
            }

            if (ext === "js") {
              return "js/[name][extname]";
            }

            if (["jpg", "jpeg", "png", "webp", "avif", "svg"].includes(ext)) {
              return "img/[name][extname]";
            }

            if (["woff2", "woff", "ttf", "eot"].includes(ext)) {
              return "fonts/[name][extname]";
            }

            return "assets/[name][extname]";
          },
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
        },
      },
    },
    plugins: [
      progress(),

      // 🔴 КРИТИЧЕСКИЙ ПОРЯДОК ДЛЯ BUILD:
      ...(isBuild
        ? [
            // 1. Самый первый - ранняя обработка SCSS (меняет пути ДО генерации изображений)
            earlyScssTransformer,

            // 2. Генерация ресурсов (шрифты, изображения, спрайты)
            fontConverter,
            // cssImageTransformer,
            svgSpriteGenerator,
            imageGenerator,

            // 3. Оборачивание изображений в HTML (работает с исходными файлами)
            earlyPictureWrapper,
          ]
        : []),

      // 4. Инклюды (должны работать в DEV и BUILD) - обрабатывает лайауты и компоненты
      htmlIncludePlugin(),

      // 5. Исправление HTML путей (только для build)
      ...(isBuild ? [fixHtmlPaths] : []),

      // 6. Инжектор шрифтов (работает в обоих режимах)
      fontInjector,

      // 7. Перемещение HTML (только для build, в самом конце)
      ...(isBuild ? [htmlMover] : []),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["legacy-js-api"],
        },
      },
      postcss: {
        plugins: [
          postcssPresetEnv({
            autoprefixer: {
              overrideBrowserslist: ["last 2 versions", "> 2%"],
            },
            features: {
              "nesting-rules": true,
              "custom-media-queries": true,
            },
          }),
          postcssImageSet(),
        ],
      },
    },
    server: {
      open: "/pages/index.html",
      host: true,
      // Важно для правильных путей в dev режиме
      middlewareMode: false,
    },
  };
});
