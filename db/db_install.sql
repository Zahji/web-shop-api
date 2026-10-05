PRAGMA foreign_keys = ON; -- Enable foreign key constraints

CREATE TABLE categories(
    category_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(11) NOT NULL CHECk(status IN ('AVAILABLE','UNAVAILABLE')) DEFAULT 'AVAILABLE'
);

CREATE TABLE products(
    product_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    category INTEGER NOT NULL REFERENCES categories(category_id),
    status VARCHAR(11) NOT NULL CHECk(status IN ('AVAILABLE','UNAVAILABLE')) DEFAULT 'AVAILABLE'
);

CREATE TABLE users(
    user_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(6) NOT NULL CHECK ( role IN ('client','admin') ) DEFAULT 'client',
    status VARCHAR(8) NOT NULL CHECk(status IN ('ENABLED','DISABLED')) DEFAULT 'ENABLED'
);

CREATE TABLE orders(
    order_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    client INTEGER NOT NULL REFERENCES users(user_id),
    order_date TIMESTAMP,
    status VARCHAR(10) NOT NULL CHECk(status IN ('NEW','PROCESSING','SHIPPED','DELIVERED','CANCELLED')) DEFAULT 'NEW'
);

CREATE TABLE order_items(
    order_fk INTEGER NOT NULL REFERENCES orders(order_id),
    product INTEGER NOT NULL REFERENCES products(product_id),
    unit_price DOUBLE PRECISION,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (order_fk,product)
);

CREATE TABLE tickets(
    ticket_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    order_fk INTEGER NOT NULL REFERENCES orders(order_id),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(11) NOT NULL CHECk(status IN ('OPEN','IN_PROGRESS','CLOSED')) DEFAULT 'OPEN'
);

INSERT INTO users(first_name, last_name, role) VALUES('Jean','Valles','admin');
INSERT INTO users(first_name, last_name) VALUES('Abdel','Kader');
INSERT INTO users(first_name, last_name) VALUES('Alice','Johnson');
INSERT INTO users(first_name, last_name, status) VALUES('Alice','Johnson','DISABLED');
