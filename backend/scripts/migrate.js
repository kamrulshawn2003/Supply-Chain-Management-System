require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { DataTypes, QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

const run = async () => {
    const queryInterface = sequelize.getQueryInterface();

    await queryInterface.createTable('SequelizeMeta', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        }
    }).catch(() => null);

    const migrationDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationDir)
        .filter((file) => file.endsWith('.js'))
        .sort();

    for (const file of files) {
        const existing = await sequelize.query(
            'SELECT name FROM SequelizeMeta WHERE name = ?',
            { replacements: [file], type: QueryTypes.SELECT }
        );

        if (existing.length) {
            console.log(`Skipping ${file}`);
            continue;
        }

        const migration = require(path.join(migrationDir, file));
        await migration.up(queryInterface, DataTypes);
        await sequelize.query(
            'INSERT INTO SequelizeMeta (name) VALUES (?)',
            { replacements: [file] }
        );
        console.log(`Applied ${file}`);
    }

    await sequelize.close();
};

run().catch(async (error) => {
    console.error('Migration failed:', error);
    await sequelize.close();
    process.exit(1);
});
