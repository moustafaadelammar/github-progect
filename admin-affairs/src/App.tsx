import { useState } from 'react'
import './App.css'

type Section = 'dashboard' | 'employees' | 'attendance' | 'leaves' | 'medical' | 'missions' | 'penalties' | 'reports' | 'settings'

const menu: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
  { id: 'employees', label: 'الموظفين', icon: '👥' },
  { id: 'attendance', label: 'الحضور والانصراف', icon: '🕘' },
  { id: 'leaves', label: 'الإجازات', icon: '🏖️' },
  { id: 'medical', label: 'الخدمات الطبية', icon: '🏥' },
  { id: 'missions', label: 'المأموريات', icon: '📋' },
  { id: 'penalties', label: 'الجزاءات', icon: '⚠️' },
  { id: 'reports', label: 'التقارير', icon: '📊' },
  { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
]

function App() {
  const [section, setSection] = useState<Section>('dashboard')

  const current = menu.find((item) => item.id === section)

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
          {menu.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? 'active' : ''}
              onClick={() => setSection(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
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
            <h1>{current?.label}</h1>
            <p>{section === 'medical' ? 'إدارة الملفات والخدمات الطبية للموظفين' : 'مرحباً بك في نظام الشئون الإدارية'}</p>
          </div>
          <div className="top-actions">
            <button className="notification">🔔</button>
            <div className="date">السبت، 26 سبتمبر 2026</div>
          </div>
        </header>

        {section === 'dashboard' && <Dashboard onMedical={() => setSection('medical')} />}
        {section === 'medical' && <MedicalServices />}
        {section !== 'dashboard' && section !== 'medical' && <Placeholder title={current?.label ?? ''} />}
      </main>
    </div>
  )
}

function Dashboard({ onMedical }: { onMedical: () => void }) {
  return (
    <>
      <section className="stats">
        {[
          ['👥', 'إجمالي الموظفين', '0', 'blue'],
          ['✓', 'الحضور اليوم', '0', 'green'],
          ['✕', 'الغياب اليوم', '0', 'red'],
          ['⏰', 'المتأخرون', '0', 'orange'],
        ].map(([icon, label, value, color]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div><span>{label}</span><strong>{value}</strong></div>
          </div>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <div><h2>الحضور والانصراف اليوم</h2><p>ملخص حركة الموظفين</p></div>
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
            <div><h2>الخدمات الطبية</h2><p>متابعة الحالة الطبية وطلبات العلاج</p></div>
            <button className="view-btn" onClick={onMedical}>فتح القسم</button>
          </div>
          <div className="medical-mini">
            <div><span>ملفات طبية</span><strong>0</strong></div>
            <div><span>طلبات علاج</span><strong>0</strong></div>
            <div><span>إجازات مرضية</span><strong>0</strong></div>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <h2>إجراءات سريعة</h2>
        <div className="actions">
          <button><span>➕</span>إضافة موظف</button>
          <button><span>📥</span>استيراد البصمة</button>
          <button><span>🏖️</span>تسجيل إجازة</button>
          <button onClick={onMedical}><span>🏥</span>الخدمات الطبية</button>
        </div>
      </section>
    </>
  )
}

function MedicalServices() {
  const [tab, setTab] = useState('overview')
  const tabs = [
    ['overview', 'نظرة عامة'],
    ['files', 'الملفات الطبية'],
    ['exams', 'الفحوصات الطبية'],
    ['sick', 'الإجازات المرضية'],
    ['treatment', 'طلبات العلاج'],
    ['insurance', 'التأمين الطبي'],
    ['providers', 'المستشفيات والجهات الطبية'],
    ['reports', 'التقارير الطبية'],
  ]

  return (
    <div className="medical-page">
      <section className="medical-hero">
        <div>
          <div className="medical-title">🏥 الخدمات الطبية</div>
          <h2>إدارة الرعاية الطبية للموظفين</h2>
          <p>ملفات طبية، فحوصات، إجازات مرضية، علاج وتأمين في مكان واحد.</p>
        </div>
        <button className="primary-btn">＋ إضافة طلب طبي</button>
      </section>

      <div className="medical-tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && <MedicalOverview />}
      {tab === 'files' && <MedicalTable title="الملفات الطبية" columns={['الموظف', 'الرقم الوظيفي', 'آخر فحص', 'الحالة', 'إجراءات']} />}
      {tab === 'exams' && <MedicalTable title="الفحوصات الطبية" columns={['الموظف', 'نوع الفحص', 'التاريخ', 'النتيجة', 'الحالة']} />}
      {tab === 'sick' && <MedicalTable title="الإجازات المرضية" columns={['الموظف', 'من', 'إلى', 'المدة', 'الاعتماد']} />}
      {tab === 'treatment' && <MedicalTable title="طلبات العلاج" columns={['الموظف', 'نوع الطلب', 'الجهة الطبية', 'التكلفة', 'الحالة']} />}
      {tab === 'insurance' && <MedicalTable title="التأمين الطبي" columns={['الموظف', 'شركة التأمين', 'رقم الوثيقة', 'البداية', 'النهاية']} />}
      {tab === 'providers' && <MedicalTable title="المستشفيات والجهات الطبية" columns={['الجهة', 'النوع', 'الهاتف', 'العنوان', 'الحالة']} />}
      {tab === 'reports' && <MedicalTable title="التقارير الطبية" columns={['التقرير', 'الفترة', 'تاريخ الإنشاء', 'أنشأه', 'إجراء']} />}
    </div>
  )
}

function MedicalOverview() {
  const cards = [
    ['👤', 'الملفات الطبية', '0', 'blue'],
    ['🩺', 'الفحوصات المستحقة', '0', 'green'],
    ['📝', 'طلبات العلاج', '0', 'orange'],
    ['🏖️', 'إجازات مرضية نشطة', '0', 'red'],
  ]

  return (
    <>
      <section className="stats medical-stats">
        {cards.map(([icon, label, value, color]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}>{icon}</div>
            <div><span>{label}</span><strong>{value}</strong></div>
          </div>
        ))}
      </section>

      <section className="medical-grid">
        <div className="panel">
          <div className="panel-header"><div><h2>آخر الطلبات الطبية</h2><p>طلبات تحتاج متابعة أو اعتماد</p></div><button className="view-btn">عرض الكل</button></div>
          <div className="empty-state small"><div className="empty-icon">🩺</div><h3>لا توجد طلبات حالياً</h3><p>ستظهر هنا طلبات العلاج والفحوصات الجديدة.</p></div>
        </div>
        <div className="panel privacy-panel">
          <div className="privacy-icon">🔐</div>
          <h2>خصوصية البيانات الطبية</h2>
          <p>البيانات الطبية حساسة. يجب تقييد الوصول إليها حسب الصلاحيات مع تسجيل عمليات العرض والتعديل.</p>
          <button className="view-btn">إدارة الصلاحيات</button>
        </div>
      </section>
    </>
  )
}

function MedicalTable({ title, columns }: { title: string; columns: string[] }) {
  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <div><h2>{title}</h2><p>لا توجد بيانات مسجلة حالياً</p></div>
        <button className="primary-btn">＋ إضافة جديد</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody><tr><td colSpan={columns.length}><div className="table-empty">لا توجد بيانات لعرضها</div></td></tr></tbody>
        </table>
      </div>
    </section>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <section className="panel placeholder">
      <div className="empty-icon">🚧</div>
      <h2>قسم {title}</h2>
      <p>القسم جاهز للربط بقاعدة البيانات والوظائف الفعلية في المرحلة التالية.</p>
    </section>
  )
}

export default App
