#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Глобален кеш в HOME директорията
const CACHE_DIR = path.join(os.homedir(), '.aiolds-cache');
const LIBS_DIR = path.join(process.cwd(), 'libs');
const TSCONFIG_BASE = path.join(process.cwd(), 'tsconfig.base.json');
const TSCONFIG_ROOT = path.join(process.cwd(), 'tsconfig.json');
const TSCONFIG_PATH = fs.existsSync(TSCONFIG_BASE) ? TSCONFIG_BASE : TSCONFIG_ROOT;

console.log(`🔍 Използва се конфигурация от: ${TSCONFIG_PATH}`);

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(LIBS_DIR)) fs.mkdirSync(LIBS_DIR, { recursive: true });

function getModulesFromConfig() {
    const rawContent = fs.readFileSync(TSCONFIG_PATH, 'utf8');
    const lines = rawContent.split('\n');
    const cleanJson = JSON.parse(rawContent.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, ""));
    const paths = cleanJson.compilerOptions.paths || {};

    return Object.keys(paths)
        .filter(name => name.startsWith('xl-'))
        .map(name => {
            const line = lines.find(l => l.includes(`"${name}"`));
            let repoUrl = null;
            if (line && line.includes('//')) {
                const comment = line.split('//')[1].trim();
                if (comment.startsWith('git@') || comment.startsWith('http')) {
                    repoUrl = comment;
                }
            }
            return { name, repoUrl };
        });
}

function sync() {
    const modules = getModulesFromConfig();

    modules.forEach(({ name, repoUrl }) => {
        const publicPath = path.join(LIBS_DIR, name);
        const cachePath = path.join(CACHE_DIR, name);

        // 1. Проверка дали съществуващата папка в libs е истинска локална разработка
        if (fs.existsSync(publicPath) && !fs.lstatSync(publicPath).isSymbolicLink()) {
            // Ако няма repoUrl в конфигурацията, приемаме че е локален сорс
            if (!repoUrl) {
                console.log(`🏠 ${name} е локален сорс. Пропускане.`);
                return;
            }
        }

        // 2. Теглене в кеша (ако имаме URL)
        if (repoUrl && !fs.existsSync(cachePath)) {
            console.log(`🚀 Теглене на ${name} в кеша...`);
            try {
                execSync(`git clone --depth 1 ${repoUrl} ${cachePath}`, { stdio: 'inherit' });
                execSync(`rm -rf ${path.join(cachePath, '.git')}`);
            } catch (e) {
                console.error(`❌ Грешка при теглене на ${name}`);
            }
        }

        // 3. ФИЗИЧЕСКО КОПИРАНЕ (замества симлинка)
        if (fs.existsSync(cachePath)) {
            // Ако в libs има симлинк или стара папка, я трием, за да копираме на чисто
            if (fs.existsSync(publicPath)) {
                console.log(`🧹 Изтриване на старото съдържание в libs/${name}`);
                fs.rmSync(publicPath, { recursive: true, force: true });
            }

            console.log(`📂 Физическо копиране: ${name} -> libs/`);

            // Използваме системна команда за бързо копиране
            const copyCmd = process.platform === "win32"
                ? `xcopy "${cachePath}" "${publicPath}" /E /I /H /Y`
                : `cp -R "${cachePath}/." "${publicPath}"`;

            fs.mkdirSync(publicPath, { recursive: true });
            execSync(copyCmd);
        }
    });
}

const mode = process.argv[2];

if (mode === 'update') {
    console.log('🧹 Почистване на кешираните модули преди обновяване...');
    const modules = getModulesFromConfig();

    modules.forEach(({ name, repoUrl }) => {
        if (repoUrl) {
            const cachePath = path.join(CACHE_DIR, name);
            if (fs.existsSync(cachePath)) {
                console.log(`🗑️ Изтриване на кеш: ${name}`);
                fs.rmSync(cachePath, { recursive: true, force: true });
            }
        }
    });
    sync();
    console.log('✅ Всички модули са обновени и копирани успешно!');
} else {
    sync();
}
