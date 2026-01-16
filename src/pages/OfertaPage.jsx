import React from 'react';

// TODO: Добавить текст оферты от заказчика (юридический отдел)
export const OfertaPage = () => {
  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px 20px',
      minHeight: '60vh',
      lineHeight: '1.8'
    }}>
      <h1 style={{ fontSize: '36px', marginBottom: '24px' }}>Публичная оферта</h1>
      
      <div style={{
        backgroundColor: '#fff3cd',
        padding: '24px',
        borderRadius: '8px',
        marginBottom: '32px',
        border: '1px solid #ffc107'
      }}>
        <p style={{ margin: 0, color: '#856404' }}>
          <strong>Внимание:</strong> Данная страница находится в разработке. 
          Текст публичной оферты будет добавлен после получения материалов от юридического отдела.
        </p>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '32px',
        borderRadius: '8px',
        color: '#6c757d'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#495057' }}>
          Содержание оферты будет включать:
        </h2>
        <ul style={{ paddingLeft: '24px' }}>
          <li>Общие положения</li>
          <li>Предмет договора</li>
          <li>Порядок оформления заказа</li>
          <li>Оплата и доставка</li>
          <li>Возврат и обмен товара</li>
          <li>Ответственность сторон</li>
          <li>Персональные данные</li>
          <li>Прочие условия</li>
        </ul>
      </div>

      <p style={{ marginTop: '32px', fontSize: '14px', color: '#6c757d' }}>
        Последнее обновление: в разработке
      </p>
    </div>
  );
};

// ✅ Default export для lazy loading
export default OfertaPage;
