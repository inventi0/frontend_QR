import { useForm, FormProvider } from "react-hook-form";
import CustomInput from "../UI/CustomInput/CustomInput";
import CustomCheckbox from "../UI/CustomCheckbox/CustomCheckbox";
import "./Order.scss";
import { useCreateOrderMutation, useSetQrTemplateMutation } from "../../api/accountApi";
import { useGetProductQuery } from "../../api/productApi";
import { useState } from "react";

export const OrderForm = ({ selected, isPreorder, onSuccess, onClose }) => {
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
  const [submitSuccess, setSubmitSuccess] = useState("");

  const productId = selected?.productId || 1;
  const templateId = selected?.templateId || null;
  const qrId = selected?.qrId || null;

  // ✅ Загружаем реальную цену продукта из backend
  const { data: product } = useGetProductQuery(productId);
  
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

  // TODO: После реализации задачи 2.1 (комбинации футболок) использовать правильный productId с учетом цвета и размера
  // Пока используем цену из загруженного продукта или fallback 2499₽
  const basePrice = product?.price || 2499;
  const finalPrice = isPreorder ? Math.round(basePrice * 0.8) : basePrice;

  const onSubmit = async (data) => {
    setSubmitError("");
    setSubmitSuccess("");
    try {
      await createOrder({
        items: [{ product_id: productId, quantity: 1 }],
      }).unwrap();
      if (templateId && qrId) {
        try {
          await setQrTemplate({ template_id: templateId }).unwrap();
        } catch (err) {
          console.error("Не удалось привязать шаблон к QR", err);
        }
      }
      setSubmitSuccess("Заказ создан!");
      onSuccess?.();
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

        <div style={{ 
          margin: '20px 0', 
          padding: '16px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              required
              style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>
              Я согласен с условиями{' '}
              <a 
                href="/oferta" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#667eea', textDecoration: 'underline' }}
              >
                публичной оферты
              </a>
            </span>
          </label>
        </div>

        <div className="submit-line">
          <button className="pay-btn" type="submit">
            {isLoading ? "Создаём..." : "ОПЛАТИТЬ"}
          </button>
          <div className={`price-tag ${isPreorder ? "discounted" : ""}`}>
            {isPreorder && <span>2499₽</span>} {Math.round(finalPrice)}₽
          </div>
        </div>
        {submitError && <div className="order-error">{submitError}</div>}
        {submitSuccess && <div className="order-success">{submitSuccess}</div>}
      </form>
    </FormProvider>
  );
};
