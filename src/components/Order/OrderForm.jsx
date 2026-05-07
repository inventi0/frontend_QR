import { useForm, FormProvider } from "react-hook-form";
import CustomInput from "../UI/CustomInput/CustomInput";
import CustomCheckbox from "../UI/CustomCheckbox/CustomCheckbox";
import "./Order.scss";
import {
  useCreateOrderMutation,
  useSetQrTemplateMutation,
  useCreatePaymentMutation,
  useCalculateDeliveryMutation,
} from "../../api/accountApi";
import { useState, useEffect } from "react";
import { formatRub } from "../../utils/money";
import { FaArrowLeft, FaTruck } from "react-icons/fa";

export const OrderForm = ({ selected, isPreorder, onSuccess, onClose, onBack }) => {
  // ← НОВОЕ: Состояние для количества товара
  const [quantity, setQuantity] = useState(1);
  const methods = useForm({
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      contact: "",
      country: "Россия",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      postal: "",
      saveAddress: false,
      useYandexDelivery: true,
    },
  });

  const cityOptions = [
    { value: "Москва", label: "Москва" },
    { value: "Санкт-Петербург", label: "Санкт-Петербург" },
    { value: "Новосибирск", label: "Новосибирск" },
    { value: "Екатеринбург", label: "Екатеринбург" },
    { value: "Казань", label: "Казань" },
    { value: "Нижний Новгород", label: "Нижний Новгород" },
    { value: "Красноярск", label: "Красноярск" },
    { value: "Челябинск", label: "Челябинск" },
    { value: "Самара", label: "Самара" },
    { value: "Уфа", label: "Уфа" },
    { value: "Ростов-на-Дону", label: "Ростов-на-Дону" },
    { value: "Омск", label: "Омск" },
    { value: "Краснодар", label: "Краснодар" },
    { value: "Воронеж", label: "Воронеж" },
    { value: "Пермь", label: "Пермь" },
    { value: "Волгоград", label: "Волгоград" },
  ];

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = methods;

  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [setQrTemplate] = useSetQrTemplateMutation();
  const [createPayment] = useCreatePaymentMutation(); // ← ДЛЯ ПЛАТЕЖА

  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [calculateDelivery, { isLoading: isCalculating }] = useCalculateDeliveryMutation();

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

  const finalPrice = selected.finalPrice || (isPreorder ? 2499 * 0.8 : 2499);
  
  // Рассчитываем итоговую сумму с учётом количества и ДОСТАВКИ
  const totalAmount = (finalPrice * quantity) + deliveryPrice;

  const watchCity = methods.watch("city");
  const watchAddress = methods.watch("address");

  // Авто-расчет доставки при изменении адреса
  useEffect(() => {
    const calc = async () => {
      if (watchCity && watchAddress && watchAddress.length > 5) {
        try {
          const res = await calculateDelivery({
            city: watchCity,
            address: watchAddress,
            items: [{ product_id: productId, quantity: quantity, weight: 0.5, name: selected.title || "Футболка" }]
          }).unwrap();
          
          if (res.pricing_total) {
             // Парсим "469.7 RUB" в число
             const price = parseFloat(res.pricing_total.split(' ')[0]);
             setDeliveryPrice(price);
          }
        } catch (err) {
          console.warn("Delivery calculation error", err);
        }
      }
    };
    const timer = setTimeout(calc, 1000); // Дебаунс 1 сек
    return () => clearTimeout(timer);
  }, [watchCity, watchAddress, quantity, productId, calculateDelivery, selected.title]);


  const onSubmit = async (data) => {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      // 1) Создание заказа
      const orderPayload = {
        items: [{ product_id: productId, quantity: quantity }],
        contact_info: data.contact,
        country: data.country,
        city: data.city,
        first_name: data.firstName,
        last_name: data.lastName,
        delivery_address: data.address,
        zip_code: data.postal,
        use_yandex_delivery: true,
      };

      const order = await createOrder(orderPayload).unwrap();

      // 2) Привязка QR-шаблона (если есть)
      if (templateId && qrId) {
        try {
          await setQrTemplate({ template_id: templateId }).unwrap();
        } catch (err) {
          console.error("Ошибка привязки QR:", err);
        }
      }

      // 3) ЗАГЛУШКА ОПЛАТЫ — переходим к успеху без YooKassa
      setSubmitSuccess("Заказ создан успешно!");
      onSuccess?.(order);

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

        {/* ← НОВОЕ: Поле для выбора количества */}
        <div className="section">
          <h3>Количество</h3>
          <div className="quantity-control">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="qty-btn"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 1;
                setQuantity(Math.max(1, Math.min(99, val)));
              }}
              className="qty-input"
            />
            <button
              type="button"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              className="qty-btn"
            >
              +
            </button>
          </div>
        </div>

        <div className="section">
          <h3>Контакт</h3>
          <CustomInput
            placeholder="Номер телефона"
            error={errors.contact?.message}
            maskOptions={{
              mask: '+{7} (000) 000-00-00',
              lazy: false,
            }}
            {...registerWithClear("contact", { required: "Обязательное поле" })}
          />
        </div>

        <div className="section">
          <h3>Доставка</h3>
          <CustomInput
            placeholder="Страна или регион"
            error={errors.country?.message}
            readOnly={true}
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
            placeholder="Адрес доставки (ул. ..., д., кв.)"
            error={errors.address?.message}
            maskOptions={{
              mask: 'ул. street, д. house, кв. apartment',
              lazy: false,
              blocks: {
                street: { mask: /^[а-яА-ЯёЁa-zA-Z0-9\s.\-]+$/ },
                house: { mask: /^[0-9а-яА-Яa-zA-Z]+$/ },
                apartment: { mask: /^[0-9а-яА-Яa-zA-Z]*$/ }
              }
            }}
            {...registerWithClear("address", { required: "Обязательное поле" })}
          />

          <div className="inline">
            <CustomInput
              type="select"
              options={cityOptions}
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

          <div className="delivery-price-block">
            <FaTruck />
            {isCalculating ? (
              <span>Считаем доставку...</span>
            ) : deliveryPrice > 0 ? (
              <span>Яндекс Доставка: <b>{formatRub(deliveryPrice)}</b></span>
            ) : (
              <span>Введите адрес для расчета доставки</span>
            )}
          </div>

          <div className="delivery-info-hint">
            * Доставка осуществляется курьером Яндекс Доставки до вашей двери
          </div>
        </div>

        <div className="offer-checkbox">
          <label>
            <input
              type="checkbox"
              required
            />
            <span>
              Я согласен с условиями{' '}
              <a 
                href="/legal-info#offer" 
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
            {isPreorder && <span>₽{Math.round(selected.basePrice * quantity || 2499 * quantity)}</span>}
            <span>₽{Math.round(totalAmount)}</span>
          </div>
        </div>

        {submitError && <div className="order-error">{submitError}</div>}
      </form>
    </FormProvider>
  );
};
