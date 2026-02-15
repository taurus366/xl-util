#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const INPUT_DIRS = ['./src/**/*.ts', './libs/*/src/**/*.ts'];
const I18N_DIR = './src/assets/i18n/';

const REGEX = /(['"])([^'"]+)\1\s*\|\s*translate|\[?translate\]?\s*=\s*(['"])([^'"]+)\3|translate\.(?:get|instant|stream)\s*\(\s*(['"])([^'"]+)\5/g;

function extract() {
    const langs = process.argv.slice(2);

    if (langs.length === 0) {
        console.error("❌ Моля, посочи езици: node extract-i18n.js bg en");
        process.exit(1);
    }

    let foundKeys = new Set();

    // 1. Сканиране на сорса
    INPUT_DIRS.forEach(pattern => {
        const files = glob.sync(pattern);
        files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            let match;
            while ((match = REGEX.exec(content)) !== null) {
                const key = match[2] || match[4] || match[6];
                if (key && !key.includes(' ') && !key.includes('\n')) {
                    foundKeys.add(key);
                }
            }
        });
    });

    console.log(`🔎 Намерени ${foundKeys.size} ключа в кода.`);

    // 2. Обновяване на файловете
    langs.forEach(lang => {
        const filePath = path.join(I18N_DIR, `${lang}.json`);
        let existingData = {};

        if (fs.existsSync(filePath)) {
            existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        const finalData = { ...existingData };
        let newKeysCount = 0;

        foundKeys.forEach(key => {
            if (!(key in finalData)) {
                // ПРЕОБРАЗУВАНЕ: get_te_fast -> "get te fast"
                // Заменяме долните черти с интервали

                finalData[key] = key.replace(/_/g, ' ');
                newKeysCount++;
            }
        });

        if (!fs.existsSync(I18N_DIR)) fs.mkdirSync(I18N_DIR, { recursive: true });

        fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2), 'utf8');
        console.log(`✅ ${lang}.json: Добавени ${newKeysCount} нови ключа с дефолтен превод.`);
    });
}

extract();
