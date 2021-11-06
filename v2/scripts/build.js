#!/usr/bin/env node
//@ts-check
const fs = require("fs");
const path = require("path");
const os = require("os");
const babel = require("@babel/core");
const { spawn } = require("child_process");

const input = [
  {
    file: path.resolve(__dirname, "../src/types.ts"),
    exportRules: true,
  },
  {
    file: path.resolve(__dirname, "../src/utils.ts"),
    exportRules: ["safeEncodeURI", "escapeHTML"],
  },
  {
    file: path.resolve(__dirname, "../src/renderer.ts"),
    exportRules: true,
  },
  {
    file: path.resolve(__dirname, "../src/main.ts"),
    exportRules: true,
  },
];
const output = {
  indexTs: path.resolve(__dirname, "../src/index.ts"),
};
const tscProjects = [
  path.resolve(__dirname, "../tsconfig.browser.json"),
  path.resolve(__dirname, "../tsconfig.node.json"),
];
const minJs = {
  input: path.resolve(__dirname, "../browser/index.js"),
  output: path.resolve(__dirname, "../browser/index.min.js"),
  outputMap: path.resolve(__dirname, "../browser/index.min.js.map"),
};

main().catch(fatal);

function fatal(error) {
  console.error(`fatal: build failed: ${error?.message || error}`);
  if (error.stack) console.error(error.stack);
  process.exit(1);
}

async function main() {
  const outputStream = fs.createWriteStream(output.indexTs);

  for (let i = 0; i < input.length; i++) {
    const { file, exportRules } = input[i];
    const fileName = path.basename(file);
    let code = fs.readFileSync(file, "utf8");
    code = removeImportStatements(code);
    code = processExports(code, exportRules);
    outputStream.write(`/// ${fileName}\n`);
    outputStream.write(code);
  }
  outputStream.close();
  console.log(`packed to ${path.relative(process.cwd(), output.indexTs)}`);

  await Promise.all(tscProjects.map((project) => tsc(project)));
  await buildMinJS();
}

async function buildMinJS() {
  const fs = require("fs/promises");
  let js = await fs.readFile(minJs.input, "utf8");
  js = `(function(){window.Mdjs={};exports=window.Mdjs;${js}\n})();`;
  await fs.writeFile(minJs.output, js);
  const result = await babel.transformFileAsync(minJs.output, {
    plugins: [
      "babel-plugin-minify-simplify",
      "babel-plugin-minify-mangle-names",
      "babel-plugin-transform-minify-booleans",
      "babel-plugin-transform-merge-sibling-variables",
    ],
    sourceMaps: true,
    comments: false,
    compact: true,
    // inputSourceMap: JSON.parse(await fs.readFile(inputFiles.map, 'utf8')),
  });
  await Promise.all([
    fs.writeFile(minJs.output, result.code),
    fs.writeFile(minJs.outputMap, JSON.stringify(result.map, null, 2)),
  ]);
  console.log(`created ${path.relative(process.cwd(), minJs.output)}`);
}

/**
 * @param {string} code
 * @returns {string}
 */
function removeImportStatements(code) {
  return code.replace(/^import\s+[\s\S]+?\s+from\s+\S+\n/gm, "");
}
/**
 *
 * @param {string} code
 * @param {boolean|string[]} exportRules
 * @return {string}
 */
function processExports(code, exportRules) {
  if (exportRules === true) return code;
  const rules = new Set(exportRules === false ? [] : exportRules);
  return code.replace(/^(export\s+)(type|class|function|const)(\s+\w+)/gm, (_, prefix, type, name) => {
    if (rules.has(name.trim())) return _;
    return type + name;
  });
}

/**
 * @param {string} project
 */
async function tsc(project) {
  const compiler = findCompiler();
  const projectName = path.basename(project);
  return new Promise((resolve, reject) => {
    const child = spawn(compiler, ["-p", projectName], {
      cwd: path.dirname(project),
      stdio: ["inherit", "inherit", "inherit"],
    });
    child.on("error", (err) => {
      console.error(err);
      return reject(err);
    });
    child.on("exit", (code, signal) => {
      console.log(`tsc "${projectName}" exit with code ${code}`);
      return resolve(code);
    });
  });
};

/**
 * @returns {string}
 */
function findCompiler() {
  const dirNames = [path.join(__dirname, ".."), path.join(__dirname, "../.."), path.join(__dirname, "../../..")];
  for (let i = 0; i < dirNames.length; i++) {
    let tsc = path.join(dirNames[i], "node_modules/.bin/tsc");
    if (os.platform() === "win32") tsc += ".cmd";
    if (isFile(tsc)) return tsc;
  }
  throw Error(`tsc is not found`);
}


/**
 * @param {string} file
 * @returns {boolean}
 */
 function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch (error) {
    return false;
  }
}
