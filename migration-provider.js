var fs = require('fs');
var path = require('path');

module.exports = function (config) {
    return {
        getMigrationsList: function () {
            return fs.readdirSync(config.migrationsDir);
        },
        /**
         * @param {Array} migrationsList list of filenames
         * @param {Array<Number>} ids of applied migration from db table
         * @return {Array} of migration filenames that have not been applied
         */

        getSql: function (migration) {
            var sql = fs.readFileSync(path.join(config.migrationsDir, migration)).toString();
            Object.keys(config.parameters || {}).forEach(function (key) {
                sql = sql.replace(new RegExp(escapeRegExp(key), "g"), config.parameters[key]);
            });
            return sql;
        },

        getPending: async function(adapter, minMigrationTime) {
            const appliedMigrationIds = await adapter.appliedMigrations();
            const migrationsList = this.getMigrationsList();
            return migrationsList.filter((migration) => {
                var id = Number(migration.match(/^(\d+)/)[0]);
                if (!isNaN(id) && (!minMigrationTime || id >= minMigrationTime) && !~appliedMigrationIds.indexOf(id) && migration.match(/^\d+\_up.*$/)) {
                    return true;
                };

                return false;
            });
        }
    };
};

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
