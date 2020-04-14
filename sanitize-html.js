#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const ROOT_PATH = path.resolve(__dirname, 'mirror');

async function walk(dir) {
  let files = await fs.readdir(dir);
  files = await Promise.all(files.map(async file => {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) return walk(filePath);
    else if(stats.isFile()) return filePath;
  }));

  return files.reduce((all, folderContents) => all.concat(folderContents), []);
}

function sanitizeHref(href) {
  return href
    .replace(/\/index\.html/, '/')
    .replace(/^index\.html(#.*)?$/, '/')
    .replace(/\.html/, '');
}

(async () => {
  const htmlFilePaths = (await walk(ROOT_PATH))
    .filter(path => path.endsWith(".html"));

  htmlFilePaths.forEach(async (path) => {
    console.log(`Sanitizing ${path}…`);
    const $ = cheerio.load(await fs.readFile(path));

    $('a[href]').each((index, element) => {
      element.attribs['href'] = sanitizeHref(element.attribs['href']);
    });

    await fs.writeFile(path, $.root().html());
  });

  console.log("Sanitizing done. 🎉")
})();