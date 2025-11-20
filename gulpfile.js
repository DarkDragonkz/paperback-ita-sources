const pb = require('paperback-extensions-common');

// Cerca Tasker sia nella radice che dentro .default (per compatibilità TS)
const Tasker = pb.Tasker || (pb.default && pb.default.Tasker);

if (!Tasker) {
    throw new Error('ERRORE CRITICO: Impossibile trovare Tasker dentro paperback-extensions-common. Le chiavi trovate sono: ' + JSON.stringify(Object.keys(pb)));
}

Tasker.bindTasks(exports);
