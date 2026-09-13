// =========================================================================
// محول قاعدة البيانات المزدوج لسَنَد (Dual Database Adapter)
// يدعم التخزين السحابي الدائم عبر PostgreSQL (Supabase) والتخزين الاحتياطي المحلي
// =========================================================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseAdapter {
  constructor() {
    this.pool = null;
    this.isPgConnected = false;
    this.dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
    this.dataFile = path.join(this.dataDir, 'sanad-db.json');

    try { fs.mkdirSync(this.dataDir, { recursive: true }); } catch (e) {}

    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (dbUrl) {
      try {
        this.pool = new Pool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000
        });
        console.log('🔌 تم تهيئة اتصال PostgreSQL (Supabase)');
      } catch (err) {
        console.error('⚠️ تعذر إنشاء Pool لـ PostgreSQL:', err.message);
      }
    } else {
      console.log('ℹ️ لم يتم العثور على DATABASE_URL — استخدام التخزين المحلي sanad-db.json');
    }
  }

  // تهيئة الجداول في PostgreSQL عند الإقلاع
  async initTables() {
    if (!this.pool) return false;
    try {
      const client = await this.pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS sanad_store (
            key VARCHAR(100) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        this.isPgConnected = true;
        console.log('✅ تم التحقق من جدول sanad_store في PostgreSQL بنجاح');
        return true;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('⚠️ فشل الاتصال بـ PostgreSQL (سيتم استخدام النسخة المحلية):', err.message);
      this.isPgConnected = false;
      return false;
    }
  }

  // تحميل البيانات عند بدء تشغيل السيرفر
  async loadInitialData(persistedMap, defaultCallback) {
    let loadedData = null;

    // 1. محاولة التحميل من PostgreSQL إذا كان متصلاً
    if (this.pool) {
      const ok = await this.initTables();
      if (ok) {
        try {
          const res = await this.pool.query('SELECT key, data FROM sanad_store');
          if (res.rows && res.rows.length > 0) {
            loadedData = {};
            res.rows.forEach(r => {
              loadedData[r.key] = r.data;
            });
            console.log('✅ تم تحميل البيانات الدائمة مباشرة من Supabase (PostgreSQL)');
          } else {
            console.log('ℹ️ قاعدة بيانات Supabase فارغة — سيتم رفع البيانات المحلية الأولية إليها');
          }
        } catch (e) {
          console.error('⚠️ خطأ في قراءة جداول Supabase:', e.message);
        }
      }
    }

    // 2. إذا لم توجد في Supabase، نقرأ من الملف المحلي sanad-db.json
    if (!loadedData && fs.existsSync(this.dataFile)) {
      try {
        loadedData = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
        console.log('✅ تم استعادة البيانات من الملف المحلي:', this.dataFile);
      } catch (e) {
        console.error('⚠️ خطأ في قراءة sanad-db.json:', e.message);
      }
    }

    // 3. دمج البيانات المسترجعة في الكائنات الحية
    if (loadedData) {
      for (const key of Object.keys(persistedMap)) {
        if (loadedData[key] !== undefined) {
          if (Array.isArray(persistedMap[key]) && Array.isArray(loadedData[key])) {
            persistedMap[key].length = 0;
            persistedMap[key].push(...loadedData[key]);
          } else if (typeof persistedMap[key] === 'object' && typeof loadedData[key] === 'object') {
            Object.assign(persistedMap[key], loadedData[key]);
          }
        }
      }
    }

    // 4. إذا كانت Supabase فارغة وكان لدينا بيانات محلية، نرفعها فوراً إلى Supabase
    if (this.isPgConnected && (!loadedData || Object.keys(loadedData).length === 0)) {
      console.log('🚀 جاري تهيئة ومزامنة البيانات الأولية إلى Supabase...');
      await this.saveAll(persistedMap);
    }

    if (defaultCallback) defaultCallback();
  }

  // حفظ جميع الكيانات (في Supabase + نسخة محلية)
  async saveAll(persistedMap) {
    // 1. الحفظ المحلي الاحتياطي
    try {
      const snapshot = {};
      for (const key of Object.keys(persistedMap)) {
        snapshot[key] = persistedMap[key];
      }
      const tmp = this.dataFile + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(snapshot, null, 2));
      fs.renameSync(tmp, this.dataFile);
    } catch (err) {
      console.error('❌ خطأ في الحفظ المحلي:', err.message);
    }

    // 2. الحفظ السحابي في Supabase
    if (this.isPgConnected && this.pool) {
      try {
        for (const key of Object.keys(persistedMap)) {
          const val = JSON.stringify(persistedMap[key]);
          await this.pool.query(`
            INSERT INTO sanad_store (key, data, updated_at)
            VALUES ($1, $2::jsonb, NOW())
            ON CONFLICT (key)
            DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
          `, [key, val]);
        }
      } catch (pgErr) {
        console.error('⚠️ خطأ في حفظ التعديلات في Supabase:', pgErr.message);
      }
    }
  }
}

module.exports = new DatabaseAdapter();
