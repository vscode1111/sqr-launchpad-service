import appRoot from 'app-root-path';
import { readFileSync } from 'fs';
import path from 'path';
import { PackageFile } from '~common-service';
import { replaceTexts } from '../../common/files';

const packagePath = path.join(appRoot.path, 'package.json');

const packageFile: PackageFile = JSON.parse(readFileSync(packagePath, 'utf-8'));

const { name, version } = packageFile;

const description = `${name} v${version}`;

console.log(`!>>> Build ${description}`);

replaceTexts(path.join(appRoot.path, 'dist/common-service/handlers/index.js'), [
  {
    pattern: /name: process.env.npm_package_name,/g,
    text: `name: '${name}',`,
  },
  {
    pattern: /version: process.env.npm_package_version,/g,
    text: `version: '${version}',`,
  },
]);

replaceTexts(path.join(appRoot.path, 'dist/index.js'), [
  {
    pattern: /Service is running.../g,
    text: `!>>> Service [${description}] is running...`,
  },
]);
