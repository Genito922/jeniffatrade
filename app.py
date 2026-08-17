from flask import Flask, render_template, request, jsonify
import sqlite3
import os

app = Flask(__name__)

ADMIN_PIN  = 'Jeniffa2026'
DB_FILE    = 'jenifa_catalogue.db'


# ── BASE DE DONNÉES ────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id            TEXT PRIMARY KEY,
            name          TEXT NOT NULL,
            price         TEXT NOT NULL,
            category      TEXT NOT NULL,
            image_data    TEXT DEFAULT '',
            video_url     TEXT DEFAULT '',
            created_at    INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()


def check_pin():
    pin = request.headers.get('X-Admin-Pin', '')
    return pin == ADMIN_PIN


# ── PAGE PRINCIPALE ────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


# ── API PRODUITS ───────────────────────────────────────────────────────────────

@app.route('/api/products', methods=['GET'])
def api_get_products():
    conn = get_db()
    rows = conn.execute('SELECT * FROM products ORDER BY created_at DESC').fetchall()
    conn.close()
    products = [
        {
            'id':           r['id'],
            'name':         r['name'],
            'price':        r['price'],
            'category':     r['category'],
            'imageDataUrl': r['image_data'],
            'videoUrl':     r['video_url'],
            'createdAt':    r['created_at'],
        }
        for r in rows
    ]
    return jsonify(products)


@app.route('/api/products', methods=['POST'])
def api_save_product():
    if not check_pin():
        return jsonify({'error': 'unauthorized'}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'bad request'}), 400

    product_id  = data.get('id', '')
    name        = data.get('name', '').strip()
    price       = str(data.get('price', '')).strip()
    category    = data.get('category', '').strip()
    image_data  = data.get('imageDataUrl', '')
    video_url   = data.get('videoUrl', '').strip()
    created_at  = int(data.get('createdAt', 0))

    if not (product_id and name and price and category):
        return jsonify({'error': 'missing fields'}), 400

    conn = get_db()
    existing = conn.execute('SELECT id FROM products WHERE id=?', (product_id,)).fetchone()
    if existing:
        conn.execute(
            'UPDATE products SET name=?, price=?, category=?, image_data=?, video_url=? WHERE id=?',
            (name, price, category, image_data, video_url, product_id)
        )
    else:
        conn.execute(
            'INSERT INTO products (id, name, price, category, image_data, video_url, created_at) VALUES (?,?,?,?,?,?,?)',
            (product_id, name, price, category, image_data, video_url, created_at)
        )
    conn.commit()
    conn.close()
    return jsonify({'ok': True, 'id': product_id})


@app.route('/api/products/<product_id>', methods=['DELETE'])
def api_delete_product(product_id):
    if not check_pin():
        return jsonify({'error': 'unauthorized'}), 401

    conn = get_db()
    conn.execute('DELETE FROM products WHERE id=?', (product_id,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})


@app.route('/api/verify-pin', methods=['POST'])
def api_verify_pin():
    data = request.get_json(silent=True) or {}
    if data.get('pin') == ADMIN_PIN:
        return jsonify({'ok': True})
    return jsonify({'error': 'invalid pin'}), 401


# ── LANCEMENT ──────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    print(f"JENIFFA TRADE -- Catalogue sur http://localhost:{port}")
    print(f"Code admin : {ADMIN_PIN}")
    app.run(host='0.0.0.0', port=port, debug=debug)
