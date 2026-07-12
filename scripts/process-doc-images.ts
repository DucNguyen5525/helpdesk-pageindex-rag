import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

interface Args {
  src?: string;
  out?: string;
  "url-prefix"?: string;
  json?: string;
  quality?: string;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.src || !args.out || !args["url-prefix"]) {
    throw new Error(
      'Usage: npx tsx scripts/process-doc-images.ts --src ".data/Docs/...-extracted/images" --out "apps/web/public/doc-images/tech-support-manual" --url-prefix "/doc-images/tech-support-manual" [--json "....pageindex.json"] [--quality 82]'
    );
  }

  const srcDir = path.resolve(args.src);
  const outDir = path.resolve(args.out);
  const urlPrefix = args["url-prefix"].replace(/\/+$/, "");
  const quality = args.quality ? Number(args.quality) : 82;

  fs.mkdirSync(outDir, { recursive: true });

  const files = fs
    .readdirSync(srcDir)
    .filter((name) => /\.(png|jpe?g|gif|bmp|webp)$/i.test(name))
    .sort();

  let converted = 0;
  let failed = 0;
  let srcBytes = 0;
  let outBytes = 0;

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const baseName = path.basename(file, path.extname(file));
    const outPath = path.join(outDir, `${baseName}.webp`);
    try {
      // mild enhancement: normalize stretches contrast, sharpen crisps screenshot text
      await sharp(srcPath).normalize().sharpen({ sigma: 1 }).webp({ quality, effort: 4 }).toFile(outPath);
      srcBytes += fs.statSync(srcPath).size;
      outBytes += fs.statSync(outPath).size;
      converted += 1;
    } catch (error) {
      failed += 1;
      console.warn(`Failed: ${file} — ${error instanceof Error ? error.message : error}`);
    }
  }

  let refsRewritten = 0;
  if (args.json) {
    const jsonPath = path.resolve(args.json);
    const content = fs.readFileSync(jsonPath, "utf8");
    // node content refs look like ](images/imageN.png); point them at the published webp
    const rewritten = content.replace(/\]\(images\/([^)\s]+)\.(png|jpe?g|gif|bmp)\)/gi, (_match, name: string) => {
      refsRewritten += 1;
      return `](${urlPrefix}/${name}.webp)`;
    });
    fs.writeFileSync(jsonPath, rewritten, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        outDir,
        converted,
        failed,
        srcMB: Math.round((srcBytes / 1024 / 1024) * 10) / 10,
        outMB: Math.round((outBytes / 1024 / 1024) * 10) / 10,
        refsRewritten
      },
      null,
      2
    )
  );
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key.startsWith("--")) continue;
    if (!value || value.startsWith("--")) continue;
    i += 1;
    const name = key.slice(2) as keyof Args;
    args[name] = value as never;
  }
  return args;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
