const chalk = require('chalk');

const logger = {
    info: (msg) => console.log(chalk.blue(`[INFO] `) + msg),
    success: (msg) => console.log(chalk.green(`[SUCCESS] `) + msg),
    warn: (msg) => console.log(chalk.yellow(`[WARN] `) + msg),
    error: (msg, err) => {
        console.log(chalk.red(`[ERROR] `) + msg);
        if (err) console.error(err);
    },
    debug: (msg) => {
        if (process.env.DEBUG === 'true') {
            console.log(chalk.magenta(`[DEBUG] `) + msg);
        }
    }
};

module.exports = logger;
