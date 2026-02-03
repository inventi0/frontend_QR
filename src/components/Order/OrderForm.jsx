import { useForm, FormProvider } from "react-hook-form";
import CustomInput from "../UI/CustomInput/CustomInput";
import CustomCheckbox from "../UI/CustomCheckbox/CustomCheckbox";
import "./Order.scss";
import {
  useCreateOrderMutation,
  useSetQrTemplateMutation,
  useCreatePaymentMutation,   // ← НОВОЕ
} from "../../api/accountApi";
import { useState } from "react";

export const OrderForm = ({ selected, isPreorder, onSuccess }) => {
  // ← НОВОЕ: Состояние для количества товара
  const [quantity, setQuantity] = useState(1);
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
  const [createPayment] = useCreatePaymentMutation(); // ← ДЛЯ ПЛАТЕЖА

  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

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

  const finalPrice = isPreorder ? 2499 * 0.8 : 2499;
  
  // ← НОВОЕ: Рассчитываем итоговую сумму с учётом количества
  const totalAmount = finalPrice * quantity;

  const onSubmit = async (data) => {
    setSubmitError("");
    setSubmitSuccess("");

    console.log("=== НАЧИНАЕМ ОФОРМЛЕНИЕ ===");
    console.log("Введённые данные формы:", data);

    try {
      // -------------------------------
      // 1) Создание заказа
      // ← ИСПРАВЛЕНО: Теперь отправляем РЕАЛЬНОЕ количество
      // -------------------------------
      console.log("→ Отправляем createOrder:", {
        items: [{ product_id: productId, quantity: quantity }],
      });

      const order = await createOrder({
        items: [{ product_id: productId, quantity: quantity }],
      }).unwrap();

      console.log("✓ createOrder успешен! Ответ:", order);

      const orderId = order.id;

      // -------------------------------
      // 2) Привязка QR-шаблона
      // -------------------------------
      if (templateId && qrId) {
        console.log("→ Привязываем шаблон QR:", templateId);
        try {
          await setQrTemplate({ template_id: templateId }).unwrap();
          console.log("✓ QR шаблон успешно привязан");
        } catch (err) {
          console.error("X Ошибка привязки QR:", err);
        }
      } else {
        console.log("Шаблон QR не требуется");
      }

      // -------------------------------
      // 3) Создаём платёж через RTK Query
      // ← ИСПРАВЛЕНО: Отправляем сумму с учётом количества
      // -------------------------------
      console.log("→ Создаём платёж через RTK Query:", {
        order_id: orderId,
        amount: totalAmount,
      });

      let accessToken = null;
      try {
        const raw = localStorage.getItem("session");
        accessToken = raw ? JSON.parse(raw)?.accessToken : null;
      } catch {
        accessToken = null;
      }

      if (!accessToken) {
        console.error("❌ Нет accessToken! Пользователь не авторизован");
        setSubmitError("Вы не авторизованы");
        return;
      }

      let payRes;
      try {
        payRes = await createPayment({
          order_id: orderId,
          amount: totalAmount,
        }).unwrap();

        console.log("✓ Ответ createPayment:", payRes);
      } catch (err) {
        console.error("❌ Ошибка createPayment:", err);
        setSubmitError("Ошибка при создании платежа");
        return;
      }

      if (!payRes?.redirect_url) {
        console.error("❌ Нет redirect_url");
        setSubmitError("Ошибка при создании платежа");
        return;
      }

      console.log("✓ Редирект на YooKassa:", payRes.redirect_url);
      window.location.href = payRes.redirect_url;

      setSubmitSuccess("Заказ создан, переход к оплате...");
      onSuccess?.();

    } catch (err) {
      console.error("=== ОШИБКА ПРИ ОПЛАТЕ ===");
      console.error(err);

      const detail = err?.data?.detail;
      setSubmitError(
        (typeof detail === "string" && detail) ||
          err?.error ||
          "Не удалось создать заказ или платёж"
      );
    }
  };

  return (
    <FormProvider {...methods}>
      <form className="modal-panel order-form" onSubmit={handleSubmit(onSubmit)}>
        <h2>Оформление заказа</h2>

        <div className="summary">
          <img src={selected.tshirtImage} alt="Выбранная футболка" />
          <div>
            <span>Размер: {selected.size}</span>
            <span>Принт: {selected.print}</span>
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
            {isLoading ? "Создаём..." : "ОПЛАТИТЬ"}
          </button>
          <div className={`price-tag ${isPreorder ? "discounted" : ""}`}>
            {isPreorder && <span>₽{(2499 * quantity).toFixed(0)}</span>}
            <span>₽{Math.round(totalAmount)}</span>
          </div>
        </div>

        {submitError && <div className="order-error">{submitError}</div>}
        {submitSuccess && <div className="order-success">{submitSuccess}</div>}
      </form>
    </FormProvider>
  );
};
