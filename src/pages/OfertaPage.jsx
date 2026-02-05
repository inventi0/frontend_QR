import React from 'react';
import './OfertaPage.scss';

// TODO: Заменить заглушку на окончательный текст
export const OfertaPage = () => {
  return (
    <main className="oferta-page" role="main">
      <article className="oferta-container" aria-labelledby="oferta-title">
        <header className="oferta-header">
          <h1 id="oferta-title" className="oferta-title">Публичная оферта</h1>
          <p className="oferta-intro">Условия продажи и взаимодействия с покупателями.</p>
        </header>

        <section className="notice" aria-live="polite">
          <p>
            <strong>Внимание:</strong> текущая страница — заглушка. Окончательный
            юридический текст будет добавлен после получения материалов.
          </p>
        </section>

        <section className="content">
          <h2 className="content-title">Содержание (примерно)</h2>
          <ol className="content-list">
            <li>Общие положения</li>
            <li>Предмет договора</li>
            <li>Порядок оформления заказа</li>
            <li>Оплата и доставка</li>
            <li>Возврат и обмен</li>
            <li>Ответственность сторон</li>
            <li>Персональные данные</li>
            <li>Прочие условия</li>
          </ol>

          <p className="updated">Последнее обновление: в разработке</p>
        </section>
      </article>
    </main>
  );
};

export default OfertaPage;
