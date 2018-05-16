/**
 * WorkerPool
 * @class WorkerPool
 * @param concurrency
 * @param timeOut
 */
export default class WorkerPool {
    // TODO Add importScript from blob
    // Queue-dequeeur: run scripts at any time

    constuctor(concurrency, timeOut) {
        // concurrency = concurrency || navigator.hardwareConcurrency || 4;
        // Array of concurrent working threads
        this.workers = new Array(concurrency);
        // Queue of tasks
        this.tasks = [];
        // Array of deferreds results
        this.deferreds = [];
        // State of worker pool
        this.running = false;
    }

    /**
     * Add a task to the queue
     * @param name
     * @param script
     * @param message
     */
    add(name, script, message) {
        if (running) {
            // TODO not OK
            throw new Error('Cannot add to running pool');
        }
        tasks.push({ name: name, script: script, message: message, id: tasks.length });
        deferreds.push($.Deferred());
    };


    /**
     * Helper function to chain tasks on a thread
     * Note: thread is a number between 0 and concurrency - 1 which designates an entry in the workers array
     * @param thread
     */
    runNextTask(thread) {
        logger.debug({
            message: 'Run next workerpool task on thread ' + thread,
            method: 'WorkerPool.runNextTask'
        });
        if (tasks.length > 0) {
            var task = tasks.shift();
            workers[thread] = new Worker(task.script);
            workers[thread].onmessage = function (e) {
                deferreds[task.id].resolve({ name: task.name, value: e.data });
                // workers[thread].terminate();
                window.URL.revokeObjectURL(task.script);
                runNextTask(thread);
            };
            workers[thread].onerror = function (e) {
                // e is an ErrorEvent and e.error is null
                var error = new Error(e.message || 'Unknown error');
                error.taskname = task.name;
                error.filename = e.filename;
                error.colno = e.colno;
                error.lineno = e.lineno;
                deferreds[task.id].reject(error);
                // workers[thread].terminate();
                window.URL.revokeObjectURL(task.script);
                logger.crit(error);
                // No need to run next task because $.when fails on the first failing deferred
                // runNextTask(thread);
            };
            // We need JSON.stringify because of a DataCloneError with character grid values
            workers[thread].postMessage(JSON.stringify(task.message));
            if ($.type(timeOut) === 'number') {
                setTimeout(function () {
                    if (deferreds[task.id].state() === 'pending') {
                        var error = new Error('The execution of a web worker has timed out');
                        error.taskname = task.name;
                        error.filename = task.script;
                        error.timeout = true;
                        deferreds[task.id].reject(error);
                        workers[thread].terminate();
                        window.URL.revokeObjectURL(task.script);
                        logger.crit(error);
                        // No need to run next task because $.when fails on the first failing deferred
                        // runNextTask(thread);
                    }
                }, timeOut);
            }
        }
    }

    /**
     * Run the work pool
     * Note: Add all tasks first
     * @returns {*}
     */
    run() {
        if (running) {
            // TODO not OK
            throw new Error('A worker pool cannot be executed twice');
        }
        running = true;
        // Start each pool
        for (var poolId = 0; poolId < workers.length; poolId++) {
            runNextTask(poolId);
        }
        // Return an array of deferreds
        return $.when.apply($, deferreds);
    };
};

/**
 * Maintain compatibility with legacy code
 */
window.kidoju = window.kidoju || {};
window.kidoju.models = window.kidoju.models || {};
window.kidoju.models.WorkerPool = WorkerPool;