const { exec } = require('child_process');

const PORT = 5000;

const killPort = (port) => {
    const command = process.platform === 'win32'
        ? `netstat -ano | findstr :${port}`
        : `lsof -i :${port} -t`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`Port ${port} is free or command failed.`);
            return;
        }

        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = process.platform === 'win32' ? parts[parts.length - 1] : line;

            if (pid) {
                const killCmd = process.platform === 'win32'
                    ? `taskkill /F /PID ${pid}`
                    : `kill -9 ${pid}`;

                exec(killCmd, (err) => {
                    if (err) console.error(`Failed to kill process ${pid}`);
                    else console.log(`Process ${pid} on port ${port} killed.`);
                });
            }
        });
    });
};

killPort(PORT);
