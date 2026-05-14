import "./order.scss";
import { FaCheckCircle, FaGift, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export const OrderSuccess = ({ orderResult, forMyself = true, onClose }) => {
    const navigate = useNavigate();
    const orderId = orderResult?.id;

    return (
        <div className="modal-panel order-success">
            <div className="order-success__icon">
                <FaCheckCircle />
            </div>
            <h2>Заказ создан!</h2>
            {orderId && <p className="order-success__id">Заказ #{orderId}</p>}

            {forMyself ? (
                <div className="order-success__type order-success__type--self">
                    <FaUser />
                    <span>Футболка будет привязана к вашему профилю после доставки.</span>
                </div>
            ) : (
                <div className="order-success__type order-success__type--gift">
                    <FaGift />
                    <span>
                        Это подарок! Получатель сканирует QR-код на футболке
                        и привязывает её к своему профилю.
                    </span>
                </div>
            )}

            <p className="order-success__message">
                Мы свяжемся с вами для подтверждения и уточнения деталей доставки.
            </p>
            <div className="order-success__actions">
                <button className="buy-btn" onClick={onClose}>
                    Закрыть
                </button>
                {forMyself && (
                    <button
                        className="preorder-btn"
                        onClick={() => {
                            onClose();
                            navigate("/profile");
                        }}
                    >
                        Мой профиль
                    </button>
                )}
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
