import { useForm, FormProvider } from "react-hook-form";
import CustomInput from "../UI/CustomInput/CustomInput";
import CustomCheckbox from "../UI/CustomCheckbox/CustomCheckbox";
import "./Order.scss";
import { useCreateOrderMutation, useSetQrTemplateMutation } from "../../api/accountApi";
import { useState } from "react";
import { formatRub } from "../../utils/money";
import { FaArrowLeft } from "react-icons/fa";

export const OrderForm = ({ selected, isPreorder, onSuccess, onBack, onClose }) => {
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
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [setQrTemplate] = useSetQrTemplateMutation();
  const [submitError, setSubmitError] = useState("");

  const productId = selected?.productId || 1;
  const templateId = selected?.templateId || null;
  const qrId = selected?.qrId || null;

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

  const onSubmit = async () => {
    setSubmitError("");
    try {
      const result = await createOrder({
        items: [{ product_id: productId, quantity: 1 }],
      }).unwrap();
      if (templateId && qrId) {
        try {
          await setQrTemplate({ template_id: templateId }).unwrap();
        } catch (err) {
          console.error("Не удалось привязать шаблон к QR", err);
        }
      }
      onSuccess?.(result);
    } catch (err) {
      const detail = err?.data?.detail;
      setSubmitError(
        (typeof detail === "string" && detail) ||
        err?.error ||
        "Не удалось создать заказ"
      );
    }
  };

  return (
    <FormProvider {...methods}>
      <form className="modal-panel order-form" onSubmit={handleSubmit(onSubmit)}>
        <button
          type="button"
          className="close-btn"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        <button
          type="button"
          className="back-btn"
          onClick={onBack}
          aria-label="Назад к выбору"
        >
          <FaArrowLeft /> Назад
        </button>

        <h2>Оформление заказа</h2>

        <div className="order-summary">
          <img src={selected.tshirtImage} alt="Выбранная футболка" />
          <div className="order-summary__details">
            <div className="order-summary__row">
              <span className="label">Цвет</span>
              <span className="value">{selected.color || "—"}</span>
            </div>
            <div className="order-summary__row">
              <span className="label">Размер</span>
              <span className="value">{selected.size}</span>
            </div>
            <div className="order-summary__row order-summary__total">
              <span className="label">Итого</span>
              <span className="value">{formatRub(selected.finalPrice)}</span>
            </div>
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

        <div className="offer-checkbox">
          <label>
            <input
              type="checkbox"
              required
            />
            <span>
              Я согласен с условиями{" "}
              <a
                href="/oferta"
                target="_blank"
                rel="noopener noreferrer"
              >
                публичной оферты
              </a>
            </span>
          </label>
        </div>

        <div className="submit-line">
          <button className="pay-btn" type="submit" disabled={isLoading}>
            {isLoading ? "Создаём..." : "ОПЛАТИТЬ"}
          </button>
          <div className={`price-tag ${isPreorder ? "discounted" : ""}`}>
            {isPreorder && selected.basePrice != null && (
              <span>{formatRub(selected.basePrice)}</span>
            )}
            {" "}{formatRub(selected.finalPrice)}
          </div>
        </div>
        {submitError && <div className="order-error">{submitError}</div>}
      </form>
    </FormProvider>
  );
};
