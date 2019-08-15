var MigrationProvider = require('./migration-provider');
var createMigrationCommand = require('./commands/create-migration-command');
var runMigrationsCommand = require('./commands/run-migrations-command');
var rollbackMigrationCommand = require('./commands/rollback-migration-command');
let listPendingCommand = require('./commands/list-pending-command');

var LOGGER = console;

function migrate(config, adapter) {
    var migrationProvider = MigrationProvider(config);
    return runMigrationsCommand(migrationProvider, adapter, config.minMigrationTime, LOGGER).then(function () {
        return adapter.dispose();
    }, function (error) {
        function rethrowOriginalError() {
            throw error;
        }
        return adapter.dispose().then(rethrowOriginalError, rethrowOriginalError);
    });
}

function rollback(config, adapter) {
    var migrationProvider = MigrationProvider(config);
    return rollbackMigrationCommand(migrationProvider, adapter, LOGGER).then(function () {
        return adapter.dispose();
    }, function (error) {
        function rethrowOriginalError() {
            throw error;
        }
        return adapter.dispose().then(rethrowOriginalError, rethrowOriginalError);
    });
}

function create(config, name) {
    createMigrationCommand(config, LOGGER, name);
}

async function ls(config, adapter) {
    const migrationProvider = MigrationProvider(config);
    try {
        await listPendingCommand(migrationProvider, adapter, config.minMigrationTime, LOGGER);
    } catch (e) {
        adapter.dispose();
        throw e;
    }

    adapter.dispose();
}

module.exports = {
    setLogger: function (logger) {
        LOGGER = logger;
    },
    migrate: migrate,
    rollback: rollback,
    create: create,
    ls: ls,
    run: function (config, command, param) {
        config.adapter = config.adapter || 'pg';

        var Adapter = require('./adapters/' + config.adapter);
        var adapter = Adapter(config, LOGGER);

        if (!command) {
            const args = process.argv.slice(-2);
            command = args[0] == 'create' ? 'create' : args[1];
            param = args[1];
        }

        switch (command) {
            case 'create':
                create(config, param).then(onCliSuccess, onCliError);
                break;
            case 'migrate':
                migrate(config, adapter).then(onCliSuccess, onCliError);
                break;
            case 'rollback':
                rollback(config, adapter).then(onCliSuccess, onCliError);
                break;
            case 'pending':
            case 'ls':
                ls(config, adapter).then(onCliSuccess, onCliError);
                break;
            default:
                LOGGER.log(`unknown command: ${command}`);
                LOGGER.log('exit');
        }

        function onCliSuccess() {
            LOGGER.log('done');
            process.exit();
        }

        function onCliError(error) {
            LOGGER.error('ERROR:', error);
            process.exit(1);
        }
    }
};
