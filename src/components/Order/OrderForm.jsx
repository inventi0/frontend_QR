import { useState } from "react";
import CustomInput from "../UI/CustomInput";
import PaymentCardForm from "../PaymentCardForm/PaymentCardForm";
import "./order.scss";

export const OrderForm = ({ selected, isPreorder }) => {
  const [form, setForm] = useState({
    contact: "",
    country: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postal: "",
    saveAddress: false,
    cardNumber: "",
    expiration: "",
    cvc: "",
    cardName: "",
    saveCard: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const finalPrice = isPreorder ? 2499 * 0.8 : 2499;

  return (
    <div className="order-form">
      <h2>Оформление заказа</h2>

      <div className="summary">
        <img src={selected.tshirtImage} alt="Выбранная футболка" />
        <div>
          <p>Размер: {selected.size}</p>
          <p>Принт: {selected.print}</p>
        </div>
      </div>

      <div className="section">
        <h3>Контакт</h3>
        <CustomInput
          name="contact"
          value={form.contact}
          onChange={handleChange}
          placeholder="Номер телефона \\ Email"
          className="custom-input"
        />
      </div>

      <div className="section">
        <h3>Доставка</h3>
        <CustomInput
          name="country"
          value={form.country}
          onChange={handleChange}
          placeholder="Страна \\ Регион"
          className="custom-input"
        />
        <div className="inline">
          <CustomInput
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="Имя"
            className="custom-input"
          />
          <CustomInput
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Фамилия"
            className="custom-input"
          />
        </div>
        <CustomInput
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Адрес доставки"
          className="custom-input"
        />
        <div className="inline">
          <CustomInput
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Город"
            className="custom-input"
          />
          <CustomInput
            name="postal"
            value={form.postal}
            onChange={handleChange}
            placeholder="Индекс"
            className="custom-input"
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            name="saveAddress"
            checked={form.saveAddress}
            onChange={handleChange}
          />
          Сохранить данные о доставке
        </label>
      </div>

      <div className="section payment-block">
        <h3>Способ оплаты</h3>
        <PaymentCardForm form={form} handleChange={handleChange} />
      </div>

      <div className="submit-line">
        <button className="pay-btn">ОПЛАТИТЬ</button>
        <div className={`price-tag ${isPreorder ? "discounted" : ""}`}>
          {isPreorder && <span>2499₽</span>} {Math.round(finalPrice)}₽
        </div>
      </div>
    </div>
  );
};
