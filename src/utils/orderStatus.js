// Утилита для русификации статусов заказов

const ORDER_STATUS_MAP = {
  pending: "В обработке",
  processing: "Обрабатывается",
  paid: "Оплачен",
  shipped: "Отправлен",
  completed: "Завершён",
  cancelled: "Отменён",
  refunded: "Возврат средств",
};

/**
 * Переводит статус заказа на русский язык
 * @param {string} status - Статус на английском
 * @returns {string} - Статус на русском
 */
export const getOrderStatusText = (status) => {
  return ORDER_STATUS_MAP[status] || status;
};

/**
 * Возвращает CSS класс для статуса
 * @param {string} status - Статус заказа
 * @returns {string} - CSS класс
 */
export const getOrderStatusClass = (status) => {
  const classMap = {
    pending: "status-pending",
    processing: "status-processing",
    paid: "status-paid",
    shipped: "status-shipped",
    completed: "status-completed",
    cancelled: "status-cancelled",
    refunded: "status-refunded",
  };
  return classMap[status] || "status-default";
};
