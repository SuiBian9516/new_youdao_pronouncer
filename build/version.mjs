import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取package.json文件
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version;

console.log(`当前版本: ${currentVersion}`);

function parseVersion(version) {
  const [baseVersion, releaseInfo] = version.split('-');
  
  const [major, minor, patch] = baseVersion.split('.').map(Number);
  
  const result = { major, minor, patch, releaseType: null, buildNum: null };
  
  if (releaseInfo) {
    const dotIndex = releaseInfo.lastIndexOf('.');
    
    if (dotIndex !== -1) {
      result.releaseType = releaseInfo.substring(0, dotIndex);
      result.buildNum = parseInt(releaseInfo.substring(dotIndex + 1));
    } else {
      result.releaseType = releaseInfo;
    }
  }
  
  return result;
}

function updateVersion(currentVersion, versionType) {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (versionType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      return currentVersion;
  }
}

function formatVersion(version, releaseType, buildNum) {
  if (releaseType === 'stable') {
    return version;
  }
  
  return `${version}-${releaseType}${buildNum ? `.${buildNum}` : ''}`;
}

function saveVersion(version) {
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`版本已更新至: ${version}`);
}

async function main() {
  const versionAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'versionType',
      message: '请选择要进行的版本更新类型:',
      choices: [
        { name: '大版本 (x.0.0)', value: 'major' },
        { name: '小版本 (0.x.0)', value: 'minor' },
        { name: '补丁版本 (0.0.x)', value: 'patch' }
      ]
    }
  ]);

  const newBaseVersion = updateVersion(currentVersion, versionAnswer.versionType);
  console.log(`基础版本号将更新为: ${newBaseVersion}`);

  const releaseAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'releaseType',
      message: '请选择版本发布类型:',
      choices: [
        { name: '正式版 (stable)', value: 'stable' },
        { name: '测试版 (beta)', value: 'beta' },
        { name: '候选版 (rc)', value: 'rc' },
        { name: '开发版 (dev)', value: 'dev' }
      ]
    }
  ]);

  let buildNum = null;
  if (releaseAnswer.releaseType !== 'stable') {
    const buildAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'buildNum',
        message: `请输入${releaseAnswer.releaseType}版本的序号:`,
        default: '1',
        validate: (input) => {
          const num = parseInt(input);
          return !isNaN(num) && num > 0 ? true : '请输入有效的正整数';
        }
      }
    ]);
    buildNum = parseInt(buildAnswer.buildNum);
  }

  const finalVersion = formatVersion(newBaseVersion, releaseAnswer.releaseType, buildNum);

  const confirmAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `确认将版本从 ${currentVersion} 更新到 ${finalVersion}?`,
      default: true
    }
  ]);

  if (confirmAnswer.confirm) {
    saveVersion(finalVersion);
    try {
      execSync('yarn format', { stdio: 'inherit' });
      console.log('代码格式化完成');
    } catch (error) {
      console.error('代码格式化出错:', error);
      process.exit(1);
    }
  } else {
    console.log('版本更新已取消');
  }
}
main().catch(err => {
  console.error('构建过程出错:', err);
  process.exit(1);
});