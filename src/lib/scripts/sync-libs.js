#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Глобален кеш в HOME директорията
const CACHE_DIR = path.join(os.homedir(), '.aiolds-cache');
const LIBS_DIR = path.join(process.cwd(), 'libs');
const TSCONFIG_PATH = path.join(process.cwd(), 'tsconfig.base.json');

// Създаване на базовите директории
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

        // Ако папката е локална (истинска папка в libs), не я пипаме
        if (fs.existsSync(publicPath) && !fs.lstatSync(publicPath).isSymbolicLink()) {
            console.log(`🏠 ${name} е локален сорс. Пропускане.`);
            return;
        }

        // Ако имаме URL и нямаме кеш -> теглим
        if (repoUrl && !fs.existsSync(cachePath)) {
            console.log(`🚀 Теглене на ${name} от ${repoUrl}...`);
            try {
                execSync(`git clone --depth 1 ${repoUrl} ${cachePath}`, { stdio: 'inherit' });
                // Трием .git за сигурност и "read-only" усещане
                execSync(`rm -rf ${path.join(cachePath, '.git')}`);
            } catch (e) {
                console.error(`❌ Грешка при теглене на ${name}`);
            }
        }

        // Създаваме симлинк, ако сорсът е в кеша, но не е в libs
        if (fs.existsSync(cachePath) && !fs.existsSync(publicPath)) {
            console.log(`🔗 Свързване ${name} -> libs/`);
            const type = process.platform === "win32" ? "junction" : "dir";
            fs.symlinkSync(cachePath, publicPath, type);
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
                console.log(`🗑️ Изтриване на стара версия: ${name}`);
                fs.rmSync(cachePath, { recursive: true, force: true });
            }
        }
    });
    // След изчистване, пускаме стандартен sync
    sync();
    console.log('✅ Всички модули са обновени успешно!');
} else {
    sync();
}
