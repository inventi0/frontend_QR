import "./LegalInfoPage.scss";

const legalDocuments = [
  {
    id: "offer",
    title: "Публичная оферта",
    description:
      "Условия заключения договора купли-продажи товаров, порядок оплаты, доставки и возврата.",
    revisionDate: "23.02.2026",
    filePath: "/legal/public-offer.pdf",
  },
  {
    id: "user-agreement",
    title: "Пользовательское соглашение",
    description:
      "Правила использования сайта и сервиса, права и обязанности пользователей и администрации.",
    revisionDate: "23.02.2026",
    filePath: "/legal/user-agreement.pdf",
  },
  {
    id: "privacy-policy",
    title: "Политика обработки персональных данных",
    description:
      "Порядок сбора, хранения, использования и защиты персональных данных пользователей.",
    revisionDate: "23.02.2026",
    filePath: "/legal/personal-data-policy.pdf",
  },
];

const LegalInfoPage = () => {
  return (
    <section className="legal-info-page">
      <div className="legal-info-page__container">
        <h1>Правовая информация</h1>
        <p className="legal-info-page__intro">
          На этой странице доступны актуальные редакции юридических документов.
        </p>

        <div className="legal-info-page__grid">
          {legalDocuments.map((document) => (
            <article key={document.id} className="legal-info-page__card" id={document.id}>
              <h2>{document.title}</h2>
              <p>{document.description}</p>
              <span>Дата редакции: {document.revisionDate}</span>
              <a href={document.filePath} download className="legal-info-page__download">
                Скачать PDF
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LegalInfoPage;
