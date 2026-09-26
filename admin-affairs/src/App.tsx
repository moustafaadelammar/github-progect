import './App.css'

function App() {
  return (
    <div className="app" dir="rtl">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">HR</div>
          <div>
            <h2>الشئون الإدارية</h2>
            <span>نظام إدارة الشركة</span>
          </div>
        </div>

        <nav>
          <a className="active">🏠 الرئيسية</a>
          <a>👥 الموظفين</a>
          <a>🕘 الحضور والانصراف</a>
          <a>🏖️ الإجازات</a>
          <a>🏥 الخدمات الطبية</a>
          <a>📋 المأموريات</a>
          <a>⚠️ الجزاءات</a>
          <a>📊 التقارير</a>
          <a>⚙️ الإعدادات</a>
        </nav>

        <div className="user-box">
          <div className="avatar">م</div>
          <div>
            <strong>مسؤول النظام</strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>لوحة التحكم</h1>
            <p>مرحباً بك في نظام الشئون الإدارية</p>
          </div>

          <div className="top-actions">
            <button className="notification">🔔</button>
            <div className="date">السبت، 26 سبتمبر 2026</div>
          </div>
        </header>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon blue">👥</div>
            <div>
              <span>إجمالي الموظفين</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div>
              <span>الحضور اليوم</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">✕</div>
            <div>
              <span>الغياب اليوم</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">⏰</div>
            <div>
              <span>المتأخرون</span>
              <strong>0</strong>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>الحضور والانصراف اليوم</h2>
                <p>ملخص حركة الموظفين</p>
              </div>

              <button className="view-btn">عرض التفاصيل</button>
            </div>

            <div className="empty-state">
              <div className="empty-icon">🕘</div>
              <h3>لا توجد بيانات حضور</h3>
              <p>قم بإضافة بيانات الموظفين أو استيراد ملف البصمة.</p>
              <button className="primary-btn">استيراد ملف البصمة</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>الإجازات</h2>
                <p>آخر طلبات الإجازات</p>
              </div>

              <button className="view-btn">عرض الكل</button>
            </div>

            <div className="empty-state small">
              <div className="empty-icon">🏖️</div>
              <h3>لا توجد طلبات</h3>
              <p>لا توجد طلبات إجازة حالياً.</p>
            </div>
          </div>
        </section>

        <section className="quick-actions">
          <h2>إجراءات سريعة</h2>

          <div className="actions">
            <button>
              <span>➕</span>
              إضافة موظف
            </button>

            <button>
              <span>📥</span>
              استيراد البصمة
            </button>

            <button>
              <span>🏖️</span>
              تسجيل إجازة
            </button>

            <button>
              <span>📊</span>
              إنشاء تقرير
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App