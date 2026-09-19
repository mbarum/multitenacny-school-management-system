#!/bin/bash
set -e

# Ensure Redis and MariaDB packages exist
if ! which redis-server >/dev/null 2>&1 || ! which mariadbd >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" mariadb-server redis-server < /dev/null
fi

# Ensure Redis is running
if which redis-cli >/dev/null 2>&1 && ! redis-cli ping >/dev/null 2>&1; then
  redis-server --daemonize yes 2>/dev/null || true
fi

# Ensure MariaDB is running
DB_INITIALIZED=0
if which mariadbd >/dev/null 2>&1; then
  if ! mariadb-admin ping -u root >/dev/null 2>&1; then
    mkdir -p /var/run/mysqld /var/lib/mysql
    chown -R mysql:mysql /var/run/mysqld /var/lib/mysql 2>/dev/null || true
    if [ ! -d /var/lib/mysql/mysql ]; then
      mariadb-install-db --user=mysql --datadir=/var/lib/mysql 2>/dev/null || true
      DB_INITIALIZED=1
    fi
    /usr/bin/mariadbd-safe --user=mysql --datadir=/var/lib/mysql > /tmp/mariadb.log 2>&1 &
    for i in {1..15}; do
      if mariadb-admin ping -u root >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
    mariadb -u root -e "
      CREATE DATABASE IF NOT EXISTS saaslink_db;
      CREATE USER IF NOT EXISTS 'saaslink_user'@'%' IDENTIFIED BY 'your_strong_mysql_password';
      CREATE USER IF NOT EXISTS 'saaslink_user'@'localhost' IDENTIFIED BY 'your_strong_mysql_password';
      CREATE USER IF NOT EXISTS 'saaslink_user'@'127.0.0.1' IDENTIFIED BY 'your_strong_mysql_password';
      GRANT ALL PRIVILEGES ON saaslink_db.* TO 'saaslink_user'@'%';
      GRANT ALL PRIVILEGES ON saaslink_db.* TO 'saaslink_user'@'localhost';
      GRANT ALL PRIVILEGES ON saaslink_db.* TO 'saaslink_user'@'127.0.0.1';
      FLUSH PRIVILEGES;
    " 2>/dev/null || true
  fi
fi

# Ensure backend dependencies and dist bundle exist
if [ ! -d "server/node_modules" ]; then
  echo "Installing backend dependencies..."
  npm --prefix server install
fi

if [ ! -f "server/dist/main.js" ]; then
  echo "Compiling backend server..."
  npm --prefix server run build
fi

# If database was freshly initialized, run sync and seed
if [ "$DB_INITIALIZED" -eq 1 ]; then
  echo "Synchronizing database schema and running seed..."
  npm run db:sync 2>/dev/null || true
  npm run seed 2>/dev/null || true
fi

