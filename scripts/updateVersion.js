const fs = require("fs");
const project = require("../package.json");
const { version } = project;
const coreVersionString = `export const coreVersion = "[VERSION]"`;
const writeVersionToFile = (path) => {
  const data = coreVersionString.replace("[VERSION]", version);
  console.log(`Updating the version to v${version}`);
  fs.writeFileSync(path, data);
};

writeVersionToFile("./src/utils/Version.ts");
