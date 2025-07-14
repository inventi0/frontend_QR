import { useForm, FormProvider } from "react-hook-form";
import { IMaskInput } from "react-imask";
import CustomInput from "../UI/CustomInput";
// import PaymentCardForm from "../PaymentCardForm/PaymentCardForm";
import "./order.scss";

export const OrderForm = ({ selected, isPreorder }) => {
  const methods = useForm({
    mode: "onTouched",
    defaultValues: {
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
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const finalPrice = isPreorder ? 2499 * 0.8 : 2499;

  const onSubmit = (data) => {
    console.log("Order submitted:", data);
  };

  return (
    <FormProvider {...methods}>
      <form className="order-form" onSubmit={handleSubmit(onSubmit)}>
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
            placeholder="Номер телефона или Email"
            {...register("contact", { required: "Обязательное поле" })}
          />
          {errors.contact && <span className="error-text">{errors.contact.message}</span>}
        </div>

        <div className="section">
          <h3>Доставка</h3>
          <CustomInput
            placeholder="Страна или регион"
            {...register("country", { required: "Обязательное поле" })}
          />
          <div className="inline">
            <CustomInput placeholder="Имя" {...register("firstName", { required: "Обязательное поле" })} />
            <CustomInput placeholder="Фамилия" {...register("lastName", { required: "Обязательное поле" })} />
          </div>
          <CustomInput placeholder="Адрес доставки" {...register("address", { required: "Обязательное поле" })} />
          <div className="inline">
            <CustomInput placeholder="Город" {...register("city", { required: "Обязательное поле" })} />
            <IMaskInput
              className="custom-input"
              mask={"000000"}
              placeholder="Индекс"
              {...register("postal", { required: "Обязательное поле" })}
            />
          </div>
          <label className="checkbox">
            <input type="checkbox" {...register("saveAddress")} /> Сохранить данные о доставке
          </label>
        </div>

        <div className="section payment-block">
          <h3>Способ оплаты</h3>
          {/* <PaymentCardForm /> */}
        </div>

        <div className="submit-line">
          <button className="pay-btn" type="submit">
            ОПЛАТИТЬ
          </button>
          <div className={`price-tag ${isPreorder ? "discounted" : ""}`}>
            {isPreorder && <span>2499₽</span>} {Math.round(finalPrice)}₽
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
