'use strict';

import fs from 'fs';
import { minify } from 'html-minifier';

const EMAIL_TEMPLATES_DIR = `${process.cwd()}/iac/quicksight-access/templates`;
const YAML_FILE = `${process.cwd()}/template.yaml`;

let yamlString = fs.readFileSync(YAML_FILE).toString('utf-8');

const emailMessages = [...yamlString.matchAll(/\s+EmailMessage: (<(.*-email)>.*).*/g)].map(
  ([line, placeholder, templateName]) => ({ line, placeholder, templateName }),
);

emailMessages.forEach(({ line, placeholder, templateName }) => {
  const filename = `${EMAIL_TEMPLATES_DIR}/${templateName}.html`;
  const htmlString = fs.readFileSync(filename).toString('utf-8');
  const minified = minify(htmlString, {
    collapseWhitespace: true,
    html5: true,
    minifyCSS: true,
    quoteCharacter: "'",
    removeComments: true,
    useShortDoctype: true,
  });
  yamlString = yamlString.replace(line, line.replace(placeholder, `"${minified}"`));
});

fs.writeFileSync(YAML_FILE, yamlString, { encoding: 'utf-8' });
