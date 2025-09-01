import { useForm, FormProvider } from "react-hook-form";
import CustomInput from "../UI/CustomInput/CustomInput";
import CustomCheckbox from "../UI/CustomCheckbox/CustomCheckbox";
import "./order.scss";

export const OrderForm = ({ selected, isPreorder }) => {
  const methods = useForm({
    mode: "onBlur",
    reValidateMode: "onBlur",
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
    clearErrors,
    formState: { errors },
  } = methods;

  const registerWithClear = (name, rules) => {
    const reg = register(name, rules);
    return {
      ...reg,
      onChange: (e) => {
        clearErrors(name);
        reg.onChange(e);
      },
    };
  };

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
            {...registerWithClear("contact", { required: "Обязательное поле" })}
          />
        </div>

        <div className="section">
          <h3>Доставка</h3>
          <CustomInput
            placeholder="Страна или регион"
            error={errors.country?.message}
            {...registerWithClear("country", { required: "Обязательное поле" })}
          />
          <div className="inline">
            <CustomInput
              placeholder="Имя"
              error={errors.firstName?.message}
              {...registerWithClear("firstName", {
                required: "Обязательное поле",
              })}
            />
            <CustomInput
              placeholder="Фамилия"
              error={errors.lastName?.message}
              {...registerWithClear("lastName", {
                required: "Обязательное поле",
              })}
            />
          </div>
          <CustomInput
            placeholder="Адрес доставки"
            error={errors.address?.message}
            {...registerWithClear("address", { required: "Обязательное поле" })}
          />
          <div className="inline">
            <CustomInput
              placeholder="Город"
              error={errors.city?.message}
              {...registerWithClear("city", { required: "Обязательное поле" })}
            />
            <CustomInput
              placeholder="Индекс"
              error={errors.postal?.message}
              {...registerWithClear("postal", {
                required: "Обязательное поле",
              })}
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
