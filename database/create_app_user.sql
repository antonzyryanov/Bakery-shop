-- Run this script as MySQL root/admin once.
-- Update the password before running in production.

CREATE USER IF NOT EXISTS 'bakery_app'@'localhost' IDENTIFIED BY 'Baeek432ery?35425dsaafsvc!@4s';
CREATE USER IF NOT EXISTS 'bakery_app'@'127.0.0.1' IDENTIFIED BY 'Baeek432ery?35425dsaafsvc!@4s';

ALTER USER 'bakery_app'@'localhost' IDENTIFIED BY 'Baeek432ery?35425dsaafsvc!@4s';
ALTER USER 'bakery_app'@'127.0.0.1' IDENTIFIED BY 'Baeek432ery?35425dsaafsvc!@4s';

GRANT ALL PRIVILEGES ON bakery_shop.* TO 'bakery_app'@'localhost';
GRANT ALL PRIVILEGES ON bakery_shop.* TO 'bakery_app'@'127.0.0.1';

FLUSH PRIVILEGES;
