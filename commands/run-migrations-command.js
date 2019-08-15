var chalk = require('chalk');

module.exports = async function(migrationProvider, adapter, minMigrationTime, logger) {
    const pending = await migrationProvider.getPending(adapter, minMigrationTime);
    if (pending.length === 0) {
        logger.log('No pending migrations');
        return;
    }

    logger.log('Pending migrations:');
    pending.forEach(function (m) {
        logger.log(chalk.green('>>'), m);
    });

    for (let migration of pending) {
        const sql = migrationProvider.getSql(migration);
        await adapter.applyMigration(migration, sql);
    }
};
