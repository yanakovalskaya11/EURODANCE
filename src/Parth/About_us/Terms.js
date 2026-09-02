import React from 'react';
import './Terms.css'; // если нужен стиль
import Header from '../header/Header';
import { Link } from 'react-router-dom';
import Footer from '../Footer/Footer';

const Terms = () => {
  return (
    <>
    <Header/>
    <div className="main-content terms-container">
        <Link to="/" className="back-button">← Вернуться на главную</Link>

      <h1>Условия использования</h1>
      <p className="last-updated">Последнее обновление: {new Date().toLocaleDateString()}</p>

      <section>
        <h2>1. Общие положения</h2>
        <p>
          Используя сайт танцевальной студии EURODANCE, вы соглашаетесь с настоящими условиями.
          Если вы не согласны с ними, пожалуйста, не используйте наш сайт.
        </p>
      </section>

      <section>
        <h2>2. Интеллектуальная собственность</h2>
        <p>
          Все материалы сайта (тексты, изображения, логотипы) являются собственностью EURODANCE и защищены законом.
        </p>
      </section>

      <section>
        <h2>3. Ответственность</h2>
        <p>
          Мы не несем ответственности за возможные убытки, возникшие в результате использования сайта.
        </p>
      </section>

      <section>
        <h2>4. Изменения условий</h2>
        <p>
          Мы оставляем за собой право изменять условия использования. Изменения вступают в силу с момента публикации.
        </p>
      </section>

      <section>
        <h2>5. Контактная информация</h2>
        <p>
          Если у вас есть вопросы, свяжитесь с нами по адресу: <a href="mailto:eurodanceminsk@gmail.com">eurodanceminsk@gmail.com</a>
        </p>
      </section>
    </div>
    <Footer/>
    </>
  );
};

export default Terms;
