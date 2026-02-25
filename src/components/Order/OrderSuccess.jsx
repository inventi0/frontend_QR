import "./Order.scss";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export const OrderSuccess = ({ orderResult, onClose }) => {
    const navigate = useNavigate();
    const orderId = orderResult?.id;

    return (
        <div className="modal-panel order-success">
            <div className="order-success__icon">
                <FaCheckCircle />
            </div>
            <h2>Заказ создан!</h2>
            {orderId && <p className="order-success__id">Заказ #{orderId}</p>}
            <p className="order-success__message">
                Мы свяжемся с вами для подтверждения и уточнения деталей доставки.
            </p>
            <div className="order-success__actions">
                <button className="buy-btn" onClick={onClose}>
                    Закрыть
                </button>
                <button
                    className="preorder-btn"
                    onClick={() => {
                        onClose();
                        navigate("/profile#orders");
                    }}
                >
                    Мои заказы
                </button>
            </div>
        </div>
    );
};
