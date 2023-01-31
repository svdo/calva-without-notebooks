const cp = require('child_process');
const path = require('path');
const process = require('process');
const os = require('os');
const fs = require('fs');
const {
  downloadAndUnzipVSCode,
  resolveCliPathFromVSCodeExecutablePath,
  runTests,
} = require('@vscode/test-electron');

function init() {
  return new Promise((resolve, reject) => {
    try {
      const USER_CONFIG_PATH_KEY = 'VSCODE_JOYRIDE_USER_CONFIG_PATH';
      if (!process.env[USER_CONFIG_PATH_KEY]) {
        const tmpConfigPath = path.join(os.tmpdir(), 'vscode-test-runner-calva', 'user-config');
        if (fs.existsSync(tmpConfigPath)) {
          fs.rmSync(tmpConfigPath, { recursive: true });
        }
        fs.mkdirSync(tmpConfigPath, { recursive: true });
        process.env[USER_CONFIG_PATH_KEY] = tmpConfigPath;
        console.info(`USER_CONFIG_PATH: ${process.env[USER_CONFIG_PATH_KEY]}`);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  try {
    const extensionTestsPath = path.resolve(__dirname, 'runTests');

    const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders');
    console.log(`BOOM! vscodeExecutablePath: ${vscodeExecutablePath}`);
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);
    console.log(`BOOM! cliPath: ${cliPath}`);

    const testWorkspace = path.resolve(__dirname, 'workspace-1');

    const launchArgs = [
      testWorkspace,
      '--disable-workspace-trust',
      '--install-extension',
      // TODO: Build the extension first, and use the built version here
      //       In CI we will have built the extension already, so it is
      //       more a TODO to figure out where to find the built extension
      'calva-2.0.329.vsix',
      // WHen debugging tests, it can be good to use the development version of Joyride
      // If you do, comment out the install of the Joyride extension here
      // And set the `extensionDevelopmentPath` in the `runTests` call below
      '--install-extension',
      'betterthantomorrow.joyride',
    ];

    cp.spawnSync(cliPath, launchArgs, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });

    await runTests({
      // When debugging tests, it can be good to use the development version Joyride
      // extensionDevelopmentPath: '/Users/pez/Projects/joyride',
      vscodeExecutablePath,
      reuseMachineInstall: true,
      extensionTestsPath,
      launchArgs: [testWorkspace],
    })
      .then((_result) => {
        console.info('Tests finished');
      })
      .catch((err) => {
        console.error('Tests finished:', err);
        process.exit(1);
      });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

void init()
  .then(() => main())
  .catch((error) => {
    console.error('Failed to initialize test running environment:', error);
    process.exit(1);
  });
