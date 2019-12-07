import subprocess, sys
from fabric import task

@task(hosts=['test'])
def deploy(connection):
    subprocess.Popen('NODE_ENV=production npm run build', shell=True).wait() and sys.exit(1)
    subprocess.Popen('zip -r web.zip config dist pm2-processes src/backend index.js package.json', shell=True).wait() and sys.exit(1)
    subprocess.Popen('scp web.zip ubuntu@test:~/.', shell=True).wait() and sys.exit(1)
    subprocess.Popen('rm web.zip', shell=True).wait() and sys.exit(1)
    connection.run(
        """
        export NODE_ENV=production &&
        cd ~ &&
        rm -rf web/dist &&
        unzip -o web.zip -d web &&
        cd web &&
        npm install &&
        node . -c &&
        node . -s &&
        pm2 list &&
        pm2 startOrReload pm2-processes/web.json
        """
    )
