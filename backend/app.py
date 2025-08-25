#!/usr/bin/env python3
"""
GRIT+GTD Cloud Sync Backend
Simple Flask API for cross-device synchronization
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import sqlite3

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Simple SQLite database
DB_PATH = 'grit_sync.db'

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_data (
            username TEXT PRIMARY KEY,
            user_id TEXT,
            data TEXT,
            last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'GRIT+GTD Sync API',
        'version': 'v1.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/sync/<username>', methods=['POST'])
def save_user_data(username):
    """Save user data to cloud"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate Telegram user data
        if not data.get('telegramUser') or not data.get('profile'):
            return jsonify({'error': 'Invalid data structure'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Upsert user data
        cursor.execute('''
            INSERT OR REPLACE INTO user_data (username, user_id, data, last_sync)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            username,
            data['telegramUser']['id'],
            json.dumps(data)
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'username': username,
            'synced_at': datetime.now().isoformat(),
            'message': 'Данные синхронизированы'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sync/<username>', methods=['GET'])
def load_user_data(username):
    """Load user data from cloud"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT data, last_sync FROM user_data WHERE username = ?
        ''', (username,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result:
            data = json.loads(result[0])
            return jsonify({
                'success': True,
                'data': data,
                'last_sync': result[1],
                'message': 'Данные загружены'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Данные пользователя не найдены'
            }), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sync/<username>/exists', methods=['GET'])
def check_user_exists(username):
    """Check if user has data in cloud"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM user_data WHERE username = ?', (username,))
        exists = cursor.fetchone()[0] > 0
        
        conn.close()
        
        return jsonify({
            'exists': exists,
            'username': username
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get service statistics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM user_data')
        total_users = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM user_data WHERE last_sync > datetime("now", "-24 hours")')
        active_users = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'total_users': total_users,
            'active_users_24h': active_users,
            'service': 'GRIT+GTD Sync',
            'version': 'v1.0'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    print("🔥 GRIT+GTD Sync API starting...")
    print("📱 Endpoints:")
    print("  POST /sync/{username} - Save user data")
    print("  GET  /sync/{username} - Load user data") 
    print("  GET  /sync/{username}/exists - Check if user exists")
    print("  GET  /health - Health check")
    print("  GET  /stats - Service statistics")
    
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)