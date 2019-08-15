let chalk = require('chalk');

module.exports = async function(migrationProvider, adapter, minMigrationTime, logger) {
    const pending = await migrationProvider.getPending(adapter, minMigrationTime);
    logger.log('Pending migrations:');
    pending.forEach(function (m) {
        logger.log(chalk.green('>>'), m);
    });
};
