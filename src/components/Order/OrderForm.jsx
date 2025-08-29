import { useForm, FormProvider } from "react-hook-form";
import CustomInput from "../UI/CustomInput/CustomInput";
import CustomCheckbox from "../UI/CustomCheckbox/CustomCheckbox";
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
            <span>Размер: {selected.size}</span>
            <span>Принт: {selected.print}</span>
          </div>
        </div>

        <div className="section">
          <h3>Контакт</h3>
          <CustomInput
            placeholder="Номер телефона или Email"
            error={errors.contact?.message}
            {...register("contact", { required: "Обязательное поле" })}
          />
        </div>

        <div className="section">
          <h3>Доставка</h3>
          <CustomInput
            placeholder="Страна или регион"
            error={errors.country?.message}
            {...register("country", { required: "Обязательное поле" })}
          />
          <div className="inline">
            <CustomInput
              placeholder="Имя"
              error={errors.firstName?.message}
              {...register("firstName", { required: "Обязательное поле" })}
            />
            <CustomInput
              placeholder="Фамилия"
              error={errors.lastName?.message}
              {...register("lastName", { required: "Обязательное поле" })}
            />
          </div>
          <CustomInput
            placeholder="Адрес доставки"
            error={errors.address?.message}
            {...register("address", { required: "Обязательное поле" })}
          />
          <div className="inline">
            <CustomInput
              placeholder="Город"
              error={errors.city?.message}
              {...register("city", { required: "Обязательное поле" })}
            />
            <CustomInput
              placeholder="Индекс"
              error={errors.postal?.message}
              {...register("postal", { required: "Обязательное поле" })}
            />
          </div>

          <CustomCheckbox
            label="Сохранить данные о доставке"
            id="saveAddress"
            {...register("saveAddress")}
          />
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
