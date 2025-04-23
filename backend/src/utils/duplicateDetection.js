const natural = require('natural');
const stringSimilarity = require('string-similarity');
const path = require('path');
const fs = require('fs').promises;
const csv = require('csv');
const xlsx = require('xlsx');

// Process uploaded file
exports.processUploadedFile = async (filePath) => {
    try {
        const fileExt = path.extname(filePath).toLowerCase();
        let data = [];
        let headers = [];

        if (fileExt === '.csv') {
            const content = await fs.readFile(filePath, 'utf-8');
            const parsed = await new Promise((resolve, reject) => {
                csv.parse(content, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true
                }, (err, output) => {
                    if (err) reject(err);
                    resolve(output);
                });
            });
            data = parsed;
            headers = Object.keys(parsed[0] || []);
        } else if (fileExt === '.xlsx' || fileExt === '.xls') {
            const workbook = xlsx.readFile(filePath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = xlsx.utils.sheet_to_json(worksheet);
            data = jsonData;
            headers = Object.keys(jsonData[0] || []);
        }

        return { data, headers };
    } catch (error) {
        throw new Error(`Failed to process file: ${error.message}`);
    }
};

// Find duplicates in data
exports.findDuplicates = async (data, threshold = 0.8) => {
    const duplicates = [];
    const processed = new Set();

    for (let i = 0; i < data.length; i++) {
        if (processed.has(i)) continue;

        const current = data[i];
        const group = { id: i, records: [], matchedFields: [] };

        for (let j = i + 1; j < data.length; j++) {
            if (processed.has(j)) continue;

            let maxSimilarity = 0;
            const fields = [];

            // Compare each field
            for (const key in current) {
                if (current[key] && data[j][key]) {
                    const similarity = stringSimilarity.compareTwoStrings(
                        String(current[key]).toLowerCase(),
                        String(data[j][key]).toLowerCase()
                    );

                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                    }

                    if (similarity >= threshold) {
                        fields.push({
                            fieldName: key,
                            similarity: similarity
                        });
                    }
                }
            }

            if (maxSimilarity >= threshold) {
                if (group.records.length === 0) {
                    group.records.push({ ...current, id: i });
                }
                group.records.push({ ...data[j], id: j });
                group.matchedFields = fields;
                group.confidence = maxSimilarity;
                processed.add(j);
            }
        }

        if (group.records.length > 1) {
            duplicates.push(group);
            processed.add(i);
        }
    }

    return duplicates;
};